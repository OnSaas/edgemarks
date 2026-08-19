import { useEffect, useState } from "react";
import type { BackupPayload, ImportResult } from "@shared/types";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";

export function ImportPage() {
	const t = useT();
	const [text, setText] = useState("");
	const [makePublic, setMakePublic] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const [backups, setBackups] = useState<{ r2: boolean; items: Array<{ key: string; size: number; uploaded: string }> } | null>(
		null,
	);
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
		<div className="mx-auto grid max-w-3xl gap-6">
			<h1 className="text-2xl font-semibold">{t("import.title")}</h1>
			<section className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
				<textarea
					rows={10}
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={t("import.paste")}
					className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs"
				/>
				<div className="mt-3 flex flex-wrap items-center gap-3">
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={makePublic} onChange={(e) => setMakePublic(e.target.checked)} />
						{t("import.makePublic")}
					</label>
					<label className="cursor-pointer rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm">
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
					<button
						type="button"
						className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white"
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
					</button>
				</div>
				{result && (
					<p className="mt-3 text-sm text-teal-700">
						{t("import.result", {
							created: result.bookmarksCreated,
							updated: result.bookmarksUpdated,
							skipped: result.skipped,
							groups: result.groupsCreated,
						})}
					</p>
				)}
				{error && <p className="mt-3 text-sm text-red-500">{error}</p>}
			</section>
			<section className="flex flex-wrap gap-2">
				<button type="button" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" onClick={() => download("json", "all")}>
					{t("export.json")}
				</button>
				<button type="button" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" onClick={() => download("html", "all")}>
					{t("export.html")}
				</button>
				<button type="button" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm" onClick={() => download("json", "public")}>
					{t("export.public")} JSON
				</button>
				<button
					type="button"
					className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
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
				</button>
				<label className="cursor-pointer rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
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
			</section>
			<section>
				<h2 className="mb-2 font-medium">{t("backup.list")}</h2>
				{!backups?.r2 && <p className="text-sm text-[var(--muted)]">{t("backup.none")}</p>}
				<ul className="space-y-2">
					{backups?.items.map((item) => (
						<li key={item.key} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
							<span className="truncate">{item.key}</span>
							<button
								type="button"
								className="text-teal-700"
								onClick={async () => {
									if (!confirm(t("confirm.restore"))) return;
									await api.restoreKey(item.key);
								}}
							>
								restore
							</button>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
