import { Dialog } from "@base-ui/react/dialog";
import { Switch } from "@base-ui/react/switch";
import { useEffect, useState } from "react";
import type { Bookmark, Group } from "@shared/types";
import { useT } from "../lib/i18n";

const empty = (prefill?: Partial<Bookmark>): Partial<Bookmark> => ({
	title: prefill?.title ?? "",
	url: prefill?.url ?? "",
	description: prefill?.description ?? "",
	tags: prefill?.tags ?? [],
	groupId: prefill?.groupId ?? null,
	isPublic: prefill?.isPublic ?? false,
	notes: prefill?.notes ?? "",
});

export function BookmarkForm({
	open,
	onOpenChange,
	groups,
	initial,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groups: Group[];
	initial?: Partial<Bookmark> | null;
	onSubmit: (body: Partial<Bookmark>) => Promise<void>;
}) {
	const t = useT();
	const [form, setForm] = useState<Partial<Bookmark>>(empty(initial ?? undefined));
	const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		setForm(empty(initial ?? undefined));
		setTags((initial?.tags ?? []).join(", "));
		setError("");
	}, [initial, open]);

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
				<Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-xl">
					<Dialog.Title className="text-lg font-semibold">
						{initial?.id ? t("bookmark.edit") : t("bookmark.add")}
					</Dialog.Title>
					<form
						className="mt-4 grid gap-3"
						onSubmit={async (e) => {
							e.preventDefault();
							setBusy(true);
							setError("");
							try {
								await onSubmit({
									...form,
									tags: tags
										.split(",")
										.map((s) => s.trim())
										.filter(Boolean),
								});
								onOpenChange(false);
							} catch (err) {
								setError(err instanceof Error && err.message === "duplicate_url" ? t("error.duplicate") : t("error.generic"));
							} finally {
								setBusy(false);
							}
						}}
					>
						<label className="grid gap-1 text-sm">
							{t("bookmark.title")}
							<input
								required
								className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
								value={form.title ?? ""}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
							/>
						</label>
						<label className="grid gap-1 text-sm">
							{t("bookmark.url")}
							<input
								required
								type="url"
								className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
								value={form.url ?? ""}
								onChange={(e) => setForm({ ...form, url: e.target.value })}
							/>
						</label>
						<label className="grid gap-1 text-sm">
							{t("bookmark.desc")}
							<textarea
								rows={2}
								className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
								value={form.description ?? ""}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
							/>
						</label>
						<label className="grid gap-1 text-sm">
							{t("bookmark.tags")}
							<input
								className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
								placeholder={t("bookmark.tagsHint")}
								value={tags}
								onChange={(e) => setTags(e.target.value)}
							/>
						</label>
						<label className="grid gap-1 text-sm">
							{t("bookmark.group")}
							<select
								className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
								value={form.groupId ?? ""}
								onChange={(e) => setForm({ ...form, groupId: e.target.value || null })}
							>
								<option value="">{t("filter.ungrouped")}</option>
								{groups.map((g) => (
									<option key={g.id} value={g.id}>
										{g.name}
									</option>
								))}
							</select>
						</label>
						<label className="grid gap-1 text-sm">
							{t("bookmark.notes")}
							<textarea
								rows={2}
								className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
								value={form.notes ?? ""}
								onChange={(e) => setForm({ ...form, notes: e.target.value })}
							/>
						</label>
						<label className="flex items-center justify-between text-sm">
							<span>{t("bookmark.public")}</span>
							<Switch.Root
								checked={Boolean(form.isPublic)}
								onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
								className="relative flex h-6 w-10 items-center rounded-full bg-zinc-400 data-checked:bg-teal-700"
							>
								<Switch.Thumb className="h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-checked:translate-x-[18px]" />
							</Switch.Root>
						</label>
						{error && <p className="text-sm text-red-500">{error}</p>}
						<div className="mt-1 flex justify-end gap-2">
							<button type="button" className="rounded-lg px-3 py-2 text-sm" onClick={() => onOpenChange(false)}>
								{t("bookmark.cancel")}
							</button>
							<button
								type="submit"
								disabled={busy}
								className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-60"
							>
								{t("bookmark.save")}
							</button>
						</div>
					</form>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
