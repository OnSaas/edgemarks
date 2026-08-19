import { Globe, Lock } from "lucide-react";
import type { Bookmark, Group } from "@shared/types";
import { useT } from "../lib/i18n";

export function BookmarkCard({
	bookmark,
	group,
	admin,
	selected,
	onSelect,
	onEdit,
}: {
	bookmark: Bookmark;
	group?: Group;
	admin?: boolean;
	selected?: boolean;
	onSelect?: (id: string, checked: boolean) => void;
	onEdit?: (b: Bookmark) => void;
}) {
	const t = useT();
	return (
		<article className="group flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm transition hover:border-teal-700/40">
			<div className="flex items-start gap-3">
				{admin && onSelect && (
					<input
						type="checkbox"
						className="mt-1"
						checked={selected}
						onChange={(e) => onSelect(bookmark.id, e.target.checked)}
					/>
				)}
				{bookmark.favicon ? (
					<img src={bookmark.favicon} alt="" className="mt-0.5 h-5 w-5 rounded-sm" />
				) : (
					<Globe size={18} className="mt-0.5 text-[var(--muted)]" />
				)}
				<div className="min-w-0 flex-1">
					<a
						href={bookmark.url}
						target="_blank"
						rel="noreferrer"
						className="block truncate font-medium hover:text-teal-700"
					>
						{bookmark.title}
					</a>
					<p className="truncate text-xs text-[var(--muted)]">{bookmark.url}</p>
				</div>
				{admin && (bookmark.isPublic ? <Globe size={14} className="text-teal-600" /> : <Lock size={14} className="text-[var(--muted)]" />)}
			</div>
			{bookmark.description && <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">{bookmark.description}</p>}
			{admin && bookmark.notes && <p className="mt-2 line-clamp-2 text-xs text-amber-700 dark:text-amber-400">{bookmark.notes}</p>}
			<div className="mt-3 flex flex-wrap items-center gap-1.5">
				{group && <span className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-xs">{group.name}</span>}
				{bookmark.tags.map((tag) => (
					<span key={tag} className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]">
						{tag}
					</span>
				))}
				<div className="ml-auto flex gap-2">
					{admin && onEdit && (
						<button type="button" className="text-xs text-[var(--muted)] hover:text-[var(--fg)]" onClick={() => onEdit(bookmark)}>
							{t("bookmark.edit")}
						</button>
					)}
				</div>
			</div>
		</article>
	);
}
