import { useEffect, useMemo, useState } from "react";
import type { Bookmark, Group } from "@shared/types";
import { DEFAULT_FEATURES } from "@shared/types";
import { BookmarkCard } from "../components/BookmarkCard";
import { Chip, Input } from "../components/ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

export function HomePage() {
	const t = useT();
	const { site } = useAuth();
	const features = { ...DEFAULT_FEATURES, ...site?.features };
	const [q, setQ] = useState("");
	const [groupId, setGroupId] = useState("");
	const [tag, setTag] = useState("");
	const [groups, setGroups] = useState<Group[]>([]);
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void api.publicGroups().then(setGroups);
	}, []);

	useEffect(() => {
		const handle = setTimeout(() => {
			setLoading(true);
			void api
				.publicBookmarks({ q, groupId: groupId || undefined, tag: tag || undefined })
				.then(setBookmarks)
				.finally(() => setLoading(false));
		}, 180);
		return () => clearTimeout(handle);
	}, [q, groupId, tag]);

	const tags = useMemo(() => {
		const set = new Set<string>();
		for (const b of bookmarks) for (const item of b.tags) set.add(item);
		return [...set].sort();
	}, [bookmarks]);

	const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));

	return (
		<div className="grid gap-5 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
			<aside className="space-y-4">
				<div>
					<p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">{t("filter.all")}</p>
					<div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:flex-col md:overflow-visible">
						<Chip active={groupId === ""} onClick={() => setGroupId("")}>
							{t("filter.all")}
						</Chip>
						<Chip active={groupId === "ungrouped"} onClick={() => setGroupId("ungrouped")}>
							{t("filter.ungrouped")}
						</Chip>
						{groups.map((g) => (
							<Chip key={g.id} active={groupId === g.id} onClick={() => setGroupId(g.id)}>
								{g.icon ? `${g.icon} ` : ""}
								{g.name}
							</Chip>
						))}
					</div>
				</div>
				{features.showTags && tags.length > 0 && (
					<div>
						<p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">{t("count.tags")}</p>
						<div className="flex flex-wrap gap-1.5">
							{tags.map((item) => (
								<Chip key={item} active={tag === item} className="h-7 rounded-md text-xs" onClick={() => setTag(tag === item ? "" : item)}>
									{item}
								</Chip>
							))}
						</div>
					</div>
				)}
			</aside>
			<section>
				{features.showSearch && <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} className="mb-4" />}
				{site?.siteDescription && <p className="mb-3 text-sm text-[var(--muted)]">{site.siteDescription}</p>}
				<p className="mb-3 text-sm text-[var(--muted)]">{t("count.bookmarks", { n: bookmarks.length })}</p>
				{loading ? (
					<p className="text-sm text-[var(--muted)]">…</p>
				) : bookmarks.length === 0 ? (
					<div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)] sm:p-10">
						{q || tag || groupId ? t("empty.search") : t("empty.public")}
					</div>
				) : (
					<div className="grid gap-3 sm:grid-cols-2">
						{bookmarks.map((b) => (
							<BookmarkCard key={b.id} bookmark={b} group={b.groupId ? groupMap[b.groupId] : undefined} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}
