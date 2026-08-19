import { useEffect, useMemo, useState } from "react";
import type { Bookmark, Group } from "@shared/types";
import { BookmarkCard } from "../components/BookmarkCard";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";
import { DEFAULT_FEATURES } from "@shared/types";

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
		<div className="grid gap-6 md:grid-cols-[220px_1fr]">
			<aside className="space-y-4">
				<div>
					<p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">{t("filter.all")}</p>
					<div className="flex flex-wrap gap-1.5 md:flex-col">
						<button
							type="button"
							onClick={() => setGroupId("")}
							className={`rounded-lg px-3 py-1.5 text-left text-sm ${groupId === "" ? "bg-[var(--card)]" : "text-[var(--muted)]"}`}
						>
							{t("filter.all")}
						</button>
						<button
							type="button"
							onClick={() => setGroupId("ungrouped")}
							className={`rounded-lg px-3 py-1.5 text-left text-sm ${groupId === "ungrouped" ? "bg-[var(--card)]" : "text-[var(--muted)]"}`}
						>
							{t("filter.ungrouped")}
						</button>
						{groups.map((g) => (
							<button
								key={g.id}
								type="button"
								onClick={() => setGroupId(g.id)}
								className={`rounded-lg px-3 py-1.5 text-left text-sm ${groupId === g.id ? "bg-[var(--card)]" : "text-[var(--muted)]"}`}
							>
								{g.icon ? `${g.icon} ` : ""}
								{g.name}
							</button>
						))}
					</div>
				</div>
				{features.showTags && tags.length > 0 && (
					<div>
						<p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">{t("count.tags")}</p>
						<div className="flex flex-wrap gap-1.5">
							{tags.map((item) => (
								<button
									key={item}
									type="button"
									onClick={() => setTag(tag === item ? "" : item)}
									className={`rounded-full border px-2 py-0.5 text-xs ${tag === item ? "border-teal-700 text-teal-700" : "border-[var(--line)] text-[var(--muted)]"}`}
								>
									{item}
								</button>
							))}
						</div>
					</div>
				)}
			</aside>
			<section>
				{features.showSearch && (
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder={t("search.placeholder")}
						className="mb-4 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5"
					/>
				)}
				{site?.siteDescription && <p className="mb-3 text-sm text-[var(--muted)]">{site.siteDescription}</p>}
				<p className="mb-3 text-sm text-[var(--muted)]">{t("count.bookmarks", { n: bookmarks.length })}</p>
				{loading ? (
					<p className="text-sm text-[var(--muted)]">…</p>
				) : bookmarks.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
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
