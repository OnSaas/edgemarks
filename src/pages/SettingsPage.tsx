import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useT } from "../lib/i18n";

export function SettingsPage() {
	const t = useT();
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [href, setHref] = useState("");
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		void api.bookmarklet().then((r) => setHref(r.href));
	}, []);

	return (
		<div className="mx-auto grid max-w-xl gap-6">
			<h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
			{error && <p className="text-sm text-red-500">{error}</p>}
			{msg && <p className="text-sm text-teal-700">{msg}</p>}
			<section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
				<h2 className="font-medium">{t("settings.password")}</h2>
				<label className="grid gap-1 text-sm">
					{t("settings.current")}
					<input type="password" className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2" value={current} onChange={(e) => setCurrent(e.target.value)} />
				</label>
				<label className="grid gap-1 text-sm">
					{t("settings.next")}
					<input type="password" minLength={8} className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2" value={next} onChange={(e) => setNext(e.target.value)} />
				</label>
				<button
					type="button"
					className="justify-self-start rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
					onClick={async () => {
						try {
							await api.changePassword(current, next);
							setCurrent("");
							setNext("");
							setMsg(t("settings.changed"));
							setError("");
						} catch {
							setError(t("error.generic"));
						}
					}}
				>
					{t("settings.password")}
				</button>
			</section>
			<section className="grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
				<h2 className="font-medium">{t("settings.bookmarklet")}</h2>
				<p className="text-sm text-[var(--muted)]">{t("settings.bookmarkletHint")}</p>
				{href && (
					<a href={href} className="inline-flex w-fit rounded-lg bg-teal-700 px-3 py-2 text-sm text-white">
						{t("settings.bookmarkletBtn")}
					</a>
				)}
			</section>
		</div>
	);
}
