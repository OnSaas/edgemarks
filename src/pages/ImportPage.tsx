import { useEffect, useState } from "react";
import type { BackupPayload, ImportResult } from "@shared/types";
import { Button, PageTitle, Panel, Textarea } from "../components/ui";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";

export function ImportPage() {
	const t = useT();
	const [text, setText] = useState("");
	const [makePublic, setMakePublic] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const [backups, setBackups] = useState<{ r2: boolean; items: Array<{ key: string; size: number; uploaded: string }> } | null>(null);
	const [error, setError] = useState("");

	const refreshBackups = () => {
		void api.listBackups().then(setBackups);
	};

	useEffect(() => {
		refreshBackups();
	}, []);

	const download = (format: "json" | "html", scope: "all" | "public") => {
		window.location.href = api.exportUrl(format, scope);
	};

	return (
		<div className="mx-auto grid max-w-3xl gap-5">
			<PageTitle>{t("import.title")}</PageTitle>
			<Panel>
				<Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("import.paste")} className="font-mono text-xs" />
				<div className="flex flex-wrap items-center gap-2">
					<label className="flex h-9 items-center gap-2 text-sm">
						<input type="checkbox" className="accent-teal-700" checked={makePublic} onChange={(e) => setMakePublic(e.target.checked)} />
						{t("import.makePublic")}
					</label>
					<label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 text-sm font-medium hover:bg-[var(--soft)]">
						{t("import.file")}
						<input
							type="file"
							accept=".html,.json,.txt"
							className="hidden"
							onChange={async (e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								setText(await file.text());
							}}
						/>
					</label>
					<Button
						type="button"
						onClick={async () => {
							setError("");
							try {
								setResult(await api.importText(text, makePublic));
							} catch {
								setError(t("error.generic"));
							}
						}}
					>
						{t("import.run")}
					</Button>
				</div>
				{result && (
					<p className="text-sm text-teal-700">
						{t("import.result", {
							created: result.bookmarksCreated,
							updated: result.bookmarksUpdated,
							skipped: result.skipped,
							groups: result.groupsCreated,
						})}
					</p>
				)}
				{error && <p className="text-sm text-red-500">{error}</p>}
			</Panel>
			<div className="flex flex-wrap gap-2">
				<Button type="button" variant="secondary" onClick={() => download("json", "all")}>
					{t("export.json")}
				</Button>
				<Button type="button" variant="secondary" onClick={() => download("html", "all")}>
					{t("export.html")}
				</Button>
				<Button type="button" variant="secondary" onClick={() => download("json", "public")}>
					{t("export.public")} JSON
				</Button>
				<Button
					type="button"
					variant="secondary"
					onClick={async () => {
						try {
							await api.backupR2();
							refreshBackups();
						} catch {
							setError(t("backup.none"));
						}
					}}
				>
					{t("backup.r2")}
				</Button>
				<label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 text-sm font-medium hover:bg-[var(--soft)]">
					{t("backup.restore")}
					<input
						type="file"
						accept=".json"
						className="hidden"
						onChange={async (e) => {
							const file = e.target.files?.[0];
							if (!file || !confirm(t("confirm.restore"))) return;
							const payload = JSON.parse(await file.text()) as BackupPayload;
							await api.restore(payload);
						}}
					/>
				</label>
			</div>
			<section>
				<h2 className="mb-2 text-sm font-medium">{t("backup.list")}</h2>
				{!backups?.r2 && <p className="text-sm text-[var(--muted)]">{t("backup.none")}</p>}
				<ul className="space-y-2">
					{backups?.items.map((item) => (
						<li key={item.key} className="flex h-9 items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 text-sm">
							<span className="truncate">{item.key}</span>
							<Button
								type="button"
								variant="ghost"
								onClick={async () => {
									if (!confirm(t("confirm.restore"))) return;
									await api.restoreKey(item.key);
								}}
							>
								{t("backup.restore")}
							</Button>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
