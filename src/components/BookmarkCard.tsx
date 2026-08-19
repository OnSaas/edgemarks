import { Globe, Lock } from "lucide-react";
import type { Bookmark, Group } from "@shared/types";
import { useT } from "../lib/i18n";
import { Button } from "./ui";

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
		<article className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-[var(--card)] p-3.5 shadow-sm transition hover:border-teal-700/40 sm:p-4">
			<div className="flex items-start gap-3">
				{admin && onSelect && (
					<input
						type="checkbox"
						className="mt-1.5 h-4 w-4 accent-teal-700"
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
					<a href={bookmark.url} target="_blank" rel="noreferrer" className="block truncate font-medium hover:text-teal-700">
						{bookmark.title}
					</a>
					<p className="truncate text-xs text-[var(--muted)]">{bookmark.url}</p>
				</div>
				{admin && (bookmark.isPublic ? <Globe size={14} className="text-teal-600" /> : <Lock size={14} className="text-[var(--muted)]" />)}
			</div>
			{bookmark.description && <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">{bookmark.description}</p>}
			{admin && bookmark.notes && <p className="mt-2 line-clamp-2 text-xs text-amber-700 dark:text-amber-400">{bookmark.notes}</p>}
			<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
				{group && <span className="rounded-md bg-[var(--soft)] px-2 py-0.5 text-xs">{group.name}</span>}
				{bookmark.tags.map((tag) => (
					<span key={tag} className="rounded-md border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]">
						{tag}
					</span>
				))}
				{admin && onEdit && (
					<Button type="button" variant="ghost" className="ml-auto h-8 px-2 text-xs" onClick={() => onEdit(bookmark)}>
						{t("bookmark.edit")}
					</Button>
				)}
			</div>
		</article>
	);
}
