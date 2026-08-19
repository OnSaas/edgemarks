import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useState } from "react";
import type { Bookmark, Group } from "@shared/types";
import { useT } from "../lib/i18n";
import { Button, Field, Input, Select, Textarea, Toggle } from "./ui";

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
	onDelete,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groups: Group[];
	initial?: Partial<Bookmark> | null;
	onSubmit: (body: Partial<Bookmark>) => Promise<void>;
	onDelete?: () => Promise<void>;
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
				<Dialog.Popup className="fixed inset-x-3 top-[8vh] z-50 mx-auto max-h-[84dvh] w-[min(100%,32rem)] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-xl sm:top-1/2 sm:-translate-y-1/2 sm:p-5">
					<Dialog.Title className="text-lg font-semibold">{initial?.id ? t("bookmark.edit") : t("bookmark.add")}</Dialog.Title>
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
						<Field label={t("bookmark.title")}>
							<Input required value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
						</Field>
						<Field label={t("bookmark.url")}>
							<Input required type="url" value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} />
						</Field>
						<Field label={t("bookmark.desc")}>
							<Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
						</Field>
						<Field label={t("bookmark.tags")}>
							<Input placeholder={t("bookmark.tagsHint")} value={tags} onChange={(e) => setTags(e.target.value)} />
						</Field>
						<Field label={t("bookmark.group")}>
							<Select value={form.groupId ?? ""} onChange={(e) => setForm({ ...form, groupId: e.target.value || null })}>
								<option value="">{t("filter.ungrouped")}</option>
								{groups.map((g) => (
									<option key={g.id} value={g.id}>
										{g.name}
									</option>
								))}
							</Select>
						</Field>
						<Field label={t("bookmark.notes")}>
							<Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
						</Field>
						<label className="flex h-9 items-center justify-between text-sm">
							<span>{t("bookmark.public")}</span>
							<Toggle checked={Boolean(form.isPublic)} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
						</label>
						{error && <p className="text-sm text-red-500">{error}</p>}
						<div className="mt-1 flex flex-wrap justify-end gap-2">
							{initial?.id && onDelete && (
								<Button
									type="button"
									variant="danger"
									className="mr-auto"
									onClick={async () => {
										if (!confirm(t("confirm.delete"))) return;
										await onDelete();
										onOpenChange(false);
									}}
								>
									{t("bookmark.delete")}
								</Button>
							)}
							<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
								{t("bookmark.cancel")}
							</Button>
							<Button type="submit" disabled={busy}>
								{t("bookmark.save")}
							</Button>
						</div>
					</form>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
