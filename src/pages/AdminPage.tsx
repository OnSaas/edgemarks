import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Bookmark, Group } from "@shared/types";
import { BookmarkCard } from "../components/BookmarkCard";
import { BookmarkForm } from "../components/BookmarkForm";
import { Button, IconButton, Input } from "../components/ui";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";

export function AdminPage() {
	const t = useT();
	const [params] = useSearchParams();
	const [q, setQ] = useState("");
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [editing, setEditing] = useState<Partial<Bookmark> | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [groupName, setGroupName] = useState("");
	const [dragId, setDragId] = useState<string | null>(null);

	const load = async () => {
		const [b, g] = await Promise.all([api.adminBookmarks(q), api.adminGroups()]);
		setBookmarks(b);
		setGroups(g);
	};

	useEffect(() => {
		const handle = setTimeout(() => {
			void load();
		}, 150);
		return () => clearTimeout(handle);
	}, [q]);

	useEffect(() => {
		const url = params.get("url");
		if (!url) return;
		setEditing({ title: params.get("title") ?? "", url, isPublic: false, tags: [] });
		setFormOpen(true);
	}, [params]);

	const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));
	const selectedCount = selected.size;
	const visibleIds = useMemo(() => bookmarks.map((b) => b.id), [bookmarks]);

	return (
		<div className="grid gap-5 lg:grid-cols-[240px_1fr] lg:gap-6">
			<aside className="space-y-3">
				<form
					className="flex gap-2"
					onSubmit={async (e) => {
						e.preventDefault();
						if (!groupName.trim()) return;
						await api.createGroup({ name: groupName.trim(), isPublic: true });
						setGroupName("");
						await load();
					}}
				>
					<Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t("group.add")} />
					<IconButton type="submit" aria-label={t("group.add")}>
						<Plus size={16} />
					</IconButton>
				</form>
				<div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
					{groups.length === 0 && <p className="text-sm text-[var(--muted)]">{t("group.empty")}</p>}
					{groups.map((g) => (
						<div
							key={g.id}
							draggable
							onDragStart={() => setDragId(g.id)}
							onDragOver={(e) => e.preventDefault()}
							onDrop={async () => {
								if (!dragId || dragId === g.id) return;
								const ids = groups.map((item) => item.id);
								const from = ids.indexOf(dragId);
								const to = ids.indexOf(g.id);
								ids.splice(from, 1);
								ids.splice(to, 0, dragId);
								await api.reorderGroups(ids);
								setDragId(null);
								await load();
							}}
							className="flex h-9 min-w-[12rem] items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 lg:min-w-0"
						>
							<GripVertical size={14} className="hidden shrink-0 cursor-grab text-[var(--muted)] lg:block" />
							<input
								className="min-w-0 flex-1 bg-transparent text-sm outline-none"
								defaultValue={g.name}
								onBlur={async (e) => {
									if (e.target.value !== g.name) {
										await api.updateGroup(g.id, { name: e.target.value });
										await load();
									}
								}}
							/>
							<Button
								type="button"
								variant="ghost"
								className={`h-7 w-7 px-0 text-xs ${g.isPublic ? "text-teal-700" : ""}`}
								onClick={async () => {
									await api.updateGroup(g.id, { isPublic: !g.isPublic });
									await load();
								}}
							>
								{g.isPublic ? "P" : "·"}
							</Button>
							<IconButton
								className="h-7 w-7 border-0 bg-transparent"
								onClick={async () => {
									if (!confirm(t("confirm.delete"))) return;
									await api.deleteGroup(g.id);
									await load();
								}}
							>
								<Trash2 size={14} />
							</IconButton>
						</div>
					))}
				</div>
				<p className="hidden text-xs text-[var(--muted)] lg:block">{t("sort.hint")}</p>
			</aside>
			<section>
				<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
					<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} className="sm:flex-1" />
					<Button
						type="button"
						onClick={() => {
							setEditing({ isPublic: false, tags: [] });
							setFormOpen(true);
						}}
					>
						{t("bookmark.add")}
					</Button>
				</div>
				{selectedCount > 0 && (
					<div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm">
						<span>{t("batch.selected", { n: selectedCount })}</span>
						<Button
							type="button"
							variant="secondary"
							onClick={async () => {
								await api.setVisibility([...selected], true);
								setSelected(new Set());
								await load();
							}}
						>
							{t("batch.public")}
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={async () => {
								await api.setVisibility([...selected], false);
								setSelected(new Set());
								await load();
							}}
						>
							{t("batch.private")}
						</Button>
					</div>
				)}
				{bookmarks.length === 0 ? (
					<div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)] sm:p-10">{t("empty.admin")}</div>
				) : (
					<div className="grid gap-3 sm:grid-cols-2">
						{bookmarks.map((b) => (
							<div
								key={b.id}
								draggable
								onDragStart={() => setDragId(b.id)}
								onDragOver={(e) => e.preventDefault()}
								onDrop={async () => {
									if (!dragId || dragId === b.id) return;
									const ids = [...visibleIds];
									const from = ids.indexOf(dragId);
									const to = ids.indexOf(b.id);
									ids.splice(from, 1);
									ids.splice(to, 0, dragId);
									await api.reorderBookmarks(ids);
									setDragId(null);
									await load();
								}}
							>
								<BookmarkCard
									bookmark={b}
									group={b.groupId ? groupMap[b.groupId] : undefined}
									admin
									selected={selected.has(b.id)}
									onSelect={(id, checked) => {
										const next = new Set(selected);
										if (checked) next.add(id);
										else next.delete(id);
										setSelected(next);
									}}
									onEdit={(item) => {
										setEditing(item);
										setFormOpen(true);
									}}
								/>
							</div>
						))}
					</div>
				)}
				<BookmarkForm
					open={formOpen}
					onOpenChange={setFormOpen}
					groups={groups}
					initial={editing}
					onSubmit={async (body) => {
						if (editing?.id) await api.updateBookmark(editing.id, body);
						else await api.createBookmark(body);
						await load();
					}}
					onDelete={
						editing?.id
							? async () => {
									if (!editing.id) return;
									await api.deleteBookmark(editing.id);
									await load();
								}
							: undefined
					}
				/>
			</section>
		</div>
	);
}
