import { Hono } from "hono";
import type { BackupPayload, Bookmark, Group, SiteConfig, SiteFeatures } from "../../shared/types";
import { mergeFeatures } from "../../shared/types";
import { KEYS } from "../env";
import { detectAndParse, mergeImport, toNetscapeHtml } from "../import-export";
import { hashPassword, verifyPassword } from "../password";
import {
	canonicalizeUrl,
	faviconFor,
	filterPublicBookmarks,
	filterPublicGroups,
	getBookmarks,
	getConfig,
	getGroups,
	nextOrder,
	nowId,
	putBookmarks,
	putConfig,
	putGroups,
	sortByOrder,
	toPublicSite,
} from "../store";
import type { AppEnv } from "./auth";
import { readAdmin } from "./auth";

export const adminApi = new Hono<AppEnv>();

adminApi.use("*", async (c, next) => {
	if (!(await readAdmin(c))) return c.json({ error: "unauthorized" }, 401);
	c.set("admin", true);
	await next();
});

function parseBookmarkInput(body: Partial<Bookmark>, existing?: Bookmark): Bookmark | { error: string } {
	const url = canonicalizeUrl(body.url || existing?.url || "") ?? "";
	const title = (body.title ?? existing?.title ?? "").trim();
	if (!title) return { error: "title_required" };
	if (!url) return { error: "invalid_url" };
	const now = Date.now();
	return {
		id: existing?.id ?? nowId(),
		title,
		url,
		description: body.description?.trim() || existing?.description,
		tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean) : (existing?.tags ?? []),
		groupId: body.groupId === undefined ? (existing?.groupId ?? null) : body.groupId,
		isPublic: body.isPublic ?? existing?.isPublic ?? false,
		favicon: body.favicon || existing?.favicon || faviconFor(url),
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
		sortOrder: body.sortOrder ?? existing?.sortOrder ?? 0,
		notes: body.notes === undefined ? existing?.notes : body.notes,
	};
}

adminApi.get("/bookmarks", async (c) => {
	const q = (c.req.query("q") ?? "").trim().toLowerCase();
	let bookmarks = await getBookmarks(c.env);
	if (q) {
		bookmarks = bookmarks.filter((b) =>
			[b.title, b.url, b.description ?? "", b.notes ?? "", b.tags.join(" ")].join(" ").toLowerCase().includes(q),
		);
	}
	return c.json(sortByOrder(bookmarks));
});

adminApi.post("/bookmarks", async (c) => {
	const body = await c.req.json<Partial<Bookmark>>().catch(() => ({}));
	const parsed = parseBookmarkInput(body);
	if ("error" in parsed) return c.json(parsed, 400);
	const bookmarks = await getBookmarks(c.env);
	if (bookmarks.some((b) => b.url === parsed.url)) return c.json({ error: "duplicate_url" }, 409);
	parsed.sortOrder = nextOrder(bookmarks);
	bookmarks.push(parsed);
	await putBookmarks(c.env, bookmarks);
	return c.json(parsed, 201);
});

adminApi.put("/bookmarks/:id", async (c) => {
	const bookmarks = await getBookmarks(c.env);
	const idx = bookmarks.findIndex((b) => b.id === c.req.param("id"));
	if (idx < 0) return c.json({ error: "not_found" }, 404);
	const body = await c.req.json<Partial<Bookmark>>().catch(() => ({}));
	const parsed = parseBookmarkInput(body, bookmarks[idx]);
	if ("error" in parsed) return c.json(parsed, 400);
	if (bookmarks.some((b, i) => i !== idx && b.url === parsed.url)) return c.json({ error: "duplicate_url" }, 409);
	bookmarks[idx] = parsed;
	await putBookmarks(c.env, bookmarks);
	return c.json(parsed);
});

adminApi.delete("/bookmarks/:id", async (c) => {
	const bookmarks = await getBookmarks(c.env);
	const next = bookmarks.filter((b) => b.id !== c.req.param("id"));
	if (next.length === bookmarks.length) return c.json({ error: "not_found" }, 404);
	await putBookmarks(c.env, next);
	return c.json({ ok: true });
});

adminApi.post("/bookmarks/reorder", async (c) => {
	const body = await c.req.json<{ ids?: string[] }>().catch(() => ({}));
	const ids = body.ids ?? [];
	const bookmarks = await getBookmarks(c.env);
	const byId = new Map(bookmarks.map((b) => [b.id, b]));
	ids.forEach((id, index) => {
		const item = byId.get(id);
		if (item) item.sortOrder = index;
	});
	await putBookmarks(c.env, bookmarks);
	return c.json(sortByOrder(bookmarks));
});

adminApi.post("/bookmarks/visibility", async (c) => {
	const body = await c.req.json<{ ids?: string[]; isPublic?: boolean }>().catch(() => ({}));
	const ids = new Set(body.ids ?? []);
	const isPublic = Boolean(body.isPublic);
	const bookmarks = await getBookmarks(c.env);
	const now = Date.now();
	for (const b of bookmarks) {
		if (ids.has(b.id)) {
			b.isPublic = isPublic;
			b.updatedAt = now;
		}
	}
	await putBookmarks(c.env, bookmarks);
	return c.json({ ok: true, updated: ids.size });
});

adminApi.get("/groups", async (c) => c.json(sortByOrder(await getGroups(c.env))));

adminApi.post("/groups", async (c) => {
	const body = await c.req.json<Partial<Group>>().catch(() => ({}));
	const name = body.name?.trim() ?? "";
	if (!name) return c.json({ error: "name_required" }, 400);
	const groups = await getGroups(c.env);
	const created: Group = {
		id: nowId(),
		name,
		isPublic: body.isPublic ?? false,
		parentId: body.parentId ?? null,
		sortOrder: nextOrder(groups),
		icon: body.icon,
	};
	groups.push(created);
	await putGroups(c.env, groups);
	return c.json(created, 201);
});

adminApi.put("/groups/:id", async (c) => {
	const groups = await getGroups(c.env);
	const idx = groups.findIndex((g) => g.id === c.req.param("id"));
	if (idx < 0) return c.json({ error: "not_found" }, 404);
	const body = await c.req.json<Partial<Group>>().catch(() => ({}));
	if (body.parentId === groups[idx].id) return c.json({ error: "invalid_parent" }, 400);
	groups[idx] = {
		...groups[idx],
		name: body.name?.trim() || groups[idx].name,
		isPublic: body.isPublic ?? groups[idx].isPublic,
		parentId: body.parentId === undefined ? groups[idx].parentId : body.parentId,
		sortOrder: body.sortOrder ?? groups[idx].sortOrder,
		icon: body.icon ?? groups[idx].icon,
	};
	await putGroups(c.env, groups);
	return c.json(groups[idx]);
});

adminApi.delete("/groups/:id", async (c) => {
	const id = c.req.param("id");
	const groups = await getGroups(c.env);
	if (!groups.some((g) => g.id === id)) return c.json({ error: "not_found" }, 404);
	const remaining = groups.filter((g) => g.id !== id).map((g) => (g.parentId === id ? { ...g, parentId: null } : g));
	await putGroups(c.env, remaining);
	const bookmarks = (await getBookmarks(c.env)).map((b) => (b.groupId === id ? { ...b, groupId: null } : b));
	await putBookmarks(c.env, bookmarks);
	return c.json({ ok: true });
});

adminApi.post("/groups/reorder", async (c) => {
	const body = await c.req.json<{ ids?: string[] }>().catch(() => ({}));
	const ids = body.ids ?? [];
	const groups = await getGroups(c.env);
	const byId = new Map(groups.map((g) => [g.id, g]));
	ids.forEach((id, index) => {
		const item = byId.get(id);
		if (item) item.sortOrder = index;
	});
	await putGroups(c.env, groups);
	return c.json(sortByOrder(groups));
});

adminApi.post("/import", async (c) => {
	const body = await c.req.json<{ text?: string; makePublic?: boolean; updateExisting?: boolean }>().catch(() => ({}));
	if (!body.text?.trim()) return c.json({ error: "empty" }, 400);
	let parsed;
	try {
		parsed = detectAndParse(body.text);
	} catch {
		return c.json({ error: "parse_failed" }, 400);
	}
	const merged = mergeImport(await getGroups(c.env), await getBookmarks(c.env), parsed, {
		makePublic: Boolean(body.makePublic),
		updateExisting: body.updateExisting !== false,
	});
	await putGroups(c.env, merged.groups);
	await putBookmarks(c.env, merged.bookmarks);
	return c.json(merged.result);
});

adminApi.get("/export", async (c) => {
	const format = c.req.query("format") ?? "json";
	const scope = c.req.query("scope") ?? "all";
	const config = await getConfig(c.env);
	let groups = await getGroups(c.env);
	let bookmarks = await getBookmarks(c.env);
	if (scope === "public") {
		groups = filterPublicGroups(groups);
		bookmarks = filterPublicBookmarks(bookmarks, new Set(groups.map((g) => g.id))) as Bookmark[];
	}
	if (format === "html") {
		const html = toNetscapeHtml(groups, bookmarks);
		return new Response(html, {
			headers: {
				"content-type": "text/html; charset=utf-8",
				"content-disposition": `attachment; filename="edgemarks-${Date.now()}.html"`,
			},
		});
	}
	const payload: BackupPayload = {
		version: 1,
		exportedAt: Date.now(),
		siteName: config.siteName,
		groups,
		bookmarks,
	};
	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			"content-type": "application/json; charset=utf-8",
			"content-disposition": `attachment; filename="edgemarks-${Date.now()}.json"`,
		},
	});
});

adminApi.post("/backup", async (c) => {
	const config = await getConfig(c.env);
	const payload: BackupPayload = {
		version: 1,
		exportedAt: Date.now(),
		siteName: config.siteName,
		groups: await getGroups(c.env),
		bookmarks: await getBookmarks(c.env),
	};
	const key = `backups/edgemarks-${new Date(payload.exportedAt).toISOString().replace(/[:.]/g, "-")}.json`;
	if (!c.env.BACKUP) return c.json({ error: "r2_unavailable", payload }, 501);
	await c.env.BACKUP.put(key, JSON.stringify(payload, null, 2), {
		httpMetadata: { contentType: "application/json" },
	});
	await c.env.KV.put(KEYS.backupMeta, JSON.stringify({ key, exportedAt: payload.exportedAt }));
	return c.json({ ok: true, key, exportedAt: payload.exportedAt });
});

adminApi.get("/backups", async (c) => {
	if (!c.env.BACKUP) return c.json({ items: [], r2: false });
	const listed = await c.env.BACKUP.list({ prefix: "backups/" });
	return c.json({
		r2: true,
		items: listed.objects
			.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded }))
			.sort((a, b) => +new Date(b.uploaded) - +new Date(a.uploaded)),
	});
});

adminApi.post("/restore", async (c) => {
	const body = await c.req.json<{ payload?: BackupPayload; key?: string }>().catch(() => ({}));
	let payload = body.payload;
	if (!payload && body.key && c.env.BACKUP) {
		const obj = await c.env.BACKUP.get(body.key);
		if (!obj) return c.json({ error: "backup_not_found" }, 404);
		payload = (await obj.json()) as BackupPayload;
	}
	if (!payload?.bookmarks || !payload.groups) return c.json({ error: "invalid_backup" }, 400);
	await putGroups(c.env, payload.groups);
	await putBookmarks(c.env, payload.bookmarks);
	if (payload.siteName) {
		const config = await getConfig(c.env);
		config.siteName = payload.siteName;
		config.updatedAt = Date.now();
		await putConfig(c.env, config);
	}
	return c.json({ ok: true, groups: payload.groups.length, bookmarks: payload.bookmarks.length });
});

adminApi.get("/settings", async (c) => {
	const config = await getConfig(c.env);
	return c.json(toPublicSite(config));
});

adminApi.put("/settings", async (c) => {
	const body = await c.req.json<Partial<SiteConfig> & { features?: Partial<SiteFeatures> }>().catch(() => ({}));
	const config = await getConfig(c.env);
	if (typeof body.siteName === "string" && body.siteName.trim()) config.siteName = body.siteName.trim();
	if (typeof body.siteDescription === "string") config.siteDescription = body.siteDescription.trim().slice(0, 240);
	if (typeof body.siteIcon === "string") {
		const icon = body.siteIcon.trim();
		if (icon && icon.length > 280_000) return c.json({ error: "icon_too_large" }, 400);
		if (icon && !icon.startsWith("data:image/") && !/^https?:\/\//i.test(icon) && icon !== "/favicon.svg") {
			return c.json({ error: "invalid_icon" }, 400);
		}
		config.siteIcon = icon;
	}
	if (body.defaultLocale === "zh" || body.defaultLocale === "en") config.defaultLocale = body.defaultLocale;
	if (body.defaultTheme === "system" || body.defaultTheme === "dark" || body.defaultTheme === "light") {
		config.defaultTheme = body.defaultTheme;
	}
	if (body.features && typeof body.features === "object") {
		config.features = mergeFeatures({ ...config.features, ...body.features });
	}
	config.updatedAt = Date.now();
	await putConfig(c.env, config);
	return c.json(toPublicSite(config));
});

adminApi.put("/password", async (c) => {
	const body = await c.req.json<{ current?: string; next?: string }>().catch(() => ({}));
	const config = await getConfig(c.env);
	if (!(await verifyPassword(body.current ?? "", config.passwordHash, c.env.JWT_SECRET))) {
		return c.json({ error: "invalid_password" }, 401);
	}
	if (!body.next || body.next.length < 8) return c.json({ error: "password_too_short" }, 400);
	config.passwordHash = await hashPassword(body.next, c.env.JWT_SECRET);
	config.updatedAt = Date.now();
	await putConfig(c.env, config);
	return c.json({ ok: true });
});

adminApi.get("/bookmarklet", (c) => {
	const origin = new URL(c.req.url).origin;
	const src = `javascript:(function(){window.open(${JSON.stringify(origin)}+'/admin/add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'_blank','noopener')})();`;
	return c.json({ href: src, origin });
});
