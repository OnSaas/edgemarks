import type { Bookmark, Group, ImportResult } from "../shared/types";
import { canonicalizeUrl, faviconFor, isHttpUrl, nowId } from "./store";

type Parsed = {
	groups: Array<{ name: string; parentName: string | null }>;
	bookmarks: Array<{
		title: string;
		url: string;
		description?: string;
		tags?: string[];
		groupName: string | null;
		isPublic?: boolean;
		notes?: string;
	}>;
};

function decodeEntities(raw: string): string {
	return raw
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

export function parseNetscapeHtml(html: string): Parsed {
	const groups: Parsed["groups"] = [];
	const bookmarks: Parsed["bookmarks"] = [];
	const stack: string[] = [];
	const seenGroups = new Set<string>();

	const tokens = html.split(/<(?=DT|DL|\/DL)/i);
	for (const token of tokens) {
		const heading = token.match(/<H3[^>]*>([^<]*)<\/H3>/i);
		if (heading) {
			const name = decodeEntities(heading[1].trim());
			if (!name) continue;
			const parent = stack.at(-1) ?? null;
			const key = `${parent ?? ""}/${name}`;
			if (!seenGroups.has(key)) {
				seenGroups.add(key);
				groups.push({ name, parentName: parent });
			}
			stack.push(name);
			continue;
		}
		if (/^\/DL/i.test(token)) {
			stack.pop();
			continue;
		}
		const link = token.match(/<A\s+([^>]+)>([^<]*)<\/A>/i);
		if (link) {
			const href = canonicalizeUrl(link[1].match(/HREF="([^"]+)"/i)?.[1] ?? "");
			if (!href) continue;
			bookmarks.push({
				title: decodeEntities(link[2].trim() || href),
				url: href,
				groupName: stack.at(-1) ?? null,
			});
		}
	}
	return { groups, bookmarks };
}

export function parseChromeJson(raw: unknown): Parsed {
	const groups: Parsed["groups"] = [];
	const bookmarks: Parsed["bookmarks"] = [];
	const seen = new Set<string>();

	type Node = {
		type?: string;
		name?: string;
		url?: string;
		children?: Node[];
	};

	const walk = (node: Node, parent: string | null) => {
		if (!node) return;
		const href = node.type === "url" && node.url ? canonicalizeUrl(node.url) : null;
		if (href) {
			bookmarks.push({
				title: node.name || href,
				url: href,
				groupName: parent,
			});
			return;
		}
		const name = node.name?.trim();
		const nextParent = name && node.type === "folder" ? name : parent;
		if (name && node.type === "folder") {
			const key = `${parent ?? ""}/${name}`;
			if (!seen.has(key)) {
				seen.add(key);
				groups.push({ name, parentName: parent });
			}
		}
		for (const child of node.children ?? []) walk(child, nextParent);
	};

	if (raw && typeof raw === "object" && "roots" in (raw as object)) {
		const roots = (raw as { roots: Record<string, Node> }).roots;
		for (const key of ["bookmark_bar", "other", "synced"]) {
			if (roots[key]) walk(roots[key], null);
		}
	} else if (raw && typeof raw === "object" && Array.isArray((raw as { children?: Node[] }).children)) {
		walk(raw as Node, null);
	}
	return { groups, bookmarks };
}

export function parseCustomJson(raw: unknown): Parsed {
	if (raw && typeof raw === "object" && Array.isArray((raw as { bookmarks?: unknown }).bookmarks)) {
		const data = raw as {
			groups?: Array<{ name: string; parentId?: string | null; id?: string }>;
			bookmarks: Array<{
				title: string;
				url: string;
				description?: string;
				tags?: string[];
				groupId?: string | null;
				groupName?: string | null;
				isPublic?: boolean;
				notes?: string;
			}>;
		};
		const groupById = new Map((data.groups ?? []).map((g) => [g.id ?? g.name, g.name]));
		return {
			groups: (data.groups ?? []).map((g) => ({
				name: g.name,
				parentName: g.parentId ? (groupById.get(g.parentId) ?? null) : null,
			})),
			bookmarks: data.bookmarks
				.map((b) => ({ ...b, url: canonicalizeUrl(b.url) ?? "" }))
				.filter((b) => b.url)
				.map((b) => ({
					title: b.title || b.url,
					url: b.url,
					description: b.description,
					tags: b.tags,
					groupName: b.groupName ?? (b.groupId ? (groupById.get(b.groupId) ?? null) : null),
					isPublic: b.isPublic,
					notes: b.notes,
				})),
		};
	}
	if (Array.isArray(raw)) {
		return {
			groups: [],
			bookmarks: raw
				.filter((b) => b && typeof b === "object" && isHttpUrl(String((b as { url?: string }).url ?? "")))
				.map((b) => {
					const item = b as { title?: string; url: string; description?: string; tags?: string[] };
					return {
						title: item.title || item.url,
						url: item.url,
						description: item.description,
						tags: item.tags,
						groupName: null,
					};
				}),
		};
	}
	return { groups: [], bookmarks: [] };
}

export function detectAndParse(text: string): Parsed {
	const trimmed = text.trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		const json = JSON.parse(trimmed) as unknown;
		if (json && typeof json === "object" && "roots" in (json as object)) return parseChromeJson(json);
		return parseCustomJson(json);
	}
	return parseNetscapeHtml(trimmed);
}

export function mergeImport(
	existingGroups: Group[],
	existingBookmarks: Bookmark[],
	parsed: Parsed,
	opts: { makePublic: boolean; updateExisting: boolean },
): { groups: Group[]; bookmarks: Bookmark[]; result: ImportResult } {
	const groups = [...existingGroups];
	const bookmarks = [...existingBookmarks];
	const result: ImportResult = { groupsCreated: 0, bookmarksCreated: 0, bookmarksUpdated: 0, skipped: 0 };
	const now = Date.now();

	const findGroup = (name: string, parentId: string | null) =>
		groups.find((g) => g.name === name && g.parentId === parentId);

	const nameToId = new Map<string, string>();
	for (const g of parsed.groups) {
		const parentId = g.parentName ? (nameToId.get(g.parentName) ?? findGroup(g.parentName, null)?.id ?? null) : null;
		const existing = findGroup(g.name, parentId);
		if (existing) {
			nameToId.set(g.name, existing.id);
			continue;
		}
		const created: Group = {
			id: nowId(),
			name: g.name,
			isPublic: opts.makePublic,
			parentId,
			sortOrder: groups.length,
		};
		groups.push(created);
		nameToId.set(g.name, created.id);
		result.groupsCreated += 1;
	}

	const byUrl = new Map(bookmarks.map((b) => [b.url, b]));
	for (const item of parsed.bookmarks) {
		const groupId = item.groupName ? (nameToId.get(item.groupName) ?? null) : null;
		const url = canonicalizeUrl(item.url);
		if (!url) {
			result.skipped += 1;
			continue;
		}
		const existing = byUrl.get(url);
		if (existing) {
			if (opts.updateExisting) {
				existing.title = item.title || existing.title;
				existing.description = item.description ?? existing.description;
				existing.tags = item.tags ?? existing.tags;
				existing.notes = item.notes ?? existing.notes;
				existing.groupId = groupId ?? existing.groupId;
				existing.updatedAt = now;
				result.bookmarksUpdated += 1;
			} else {
				result.skipped += 1;
			}
			continue;
		}
		const created: Bookmark = {
			id: nowId(),
			title: item.title,
			url,
			description: item.description,
			tags: item.tags ?? [],
			groupId,
			isPublic: item.isPublic ?? opts.makePublic,
			favicon: faviconFor(item.url),
			createdAt: now,
			updatedAt: now,
			sortOrder: bookmarks.length,
			notes: item.notes,
		};
		bookmarks.push(created);
		byUrl.set(created.url, created);
		result.bookmarksCreated += 1;
	}

	return { groups, bookmarks, result };
}

export function toNetscapeHtml(groups: Group[], bookmarks: Bookmark[]): string {
	const byParent = new Map<string | null, Group[]>();
	for (const g of groups) {
		const key = g.parentId;
		const list = byParent.get(key) ?? [];
		list.push(g);
		byParent.set(key, list);
	}
	const byGroup = new Map<string | null, Bookmark[]>();
	for (const b of bookmarks) {
		const list = byGroup.get(b.groupId) ?? [];
		list.push(b);
		byGroup.set(b.groupId, list);
	}

	const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

	const renderBookmarks = (groupId: string | null, indent: string) =>
		(byGroup.get(groupId) ?? [])
			.map(
				(b) =>
					`${indent}<DT><A HREF="${esc(b.url)}" ADD_DATE="${Math.floor(b.createdAt / 1000)}">${esc(b.title)}</A>`,
			)
			.join("\n");

	const renderGroup = (group: Group, indent: string): string => {
		const children = (byParent.get(group.id) ?? []).map((c) => renderGroup(c, indent + "    ")).join("\n");
		const links = renderBookmarks(group.id, indent + "    ");
		return `${indent}<DT><H3>${esc(group.name)}</H3>
${indent}<DL><p>
${[links, children].filter(Boolean).join("\n")}
${indent}</DL><p>`;
	};

	const roots = (byParent.get(null) ?? []).map((g) => renderGroup(g, "    ")).join("\n");
	const ungrouped = renderBookmarks(null, "    ");

	return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${[ungrouped, roots].filter(Boolean).join("\n")}
</DL><p>
`;
}
