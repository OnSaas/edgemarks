import { useEffect, useState } from "react";
import type { Locale, ThemeMode } from "@shared/types";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

export function SettingsPage() {
	const t = useT();
	const { refresh } = useAuth();
	const [siteName, setSiteName] = useState("");
	const [theme, setTheme] = useState<ThemeMode>("dark");
	const [locale, setLocale] = useState<Locale>("zh");
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [href, setHref] = useState("");
	const [msg, setMsg] = useState("");

	useEffect(() => {
		void api.settings().then((s) => {
			setSiteName(s.siteName);
			setTheme(s.defaultTheme);
			setLocale(s.defaultLocale);
		});
		void api.bookmarklet().then((r) => setHref(r.href));
	}, []);

	return (
		<div className="mx-auto grid max-w-xl gap-6">
			<h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
			<section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
				<label className="grid gap-1 text-sm">
					{t("auth.siteName")}
					<input className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
				</label>
				<label className="grid gap-1 text-sm">
					{t("settings.theme")}
					<select className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2" value={theme} onChange={(e) => setTheme(e.target.value as ThemeMode)}>
						<option value="system">{t("theme.system")}</option>
						<option value="dark">{t("theme.dark")}</option>
						<option value="light">{t("theme.light")}</option>
					</select>
				</label>
				<label className="grid gap-1 text-sm">
					{t("settings.locale")}
					<select className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2" value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
						<option value="zh">简体中文</option>
						<option value="en">English</option>
					</select>
				</label>
				<button
					type="button"
					className="justify-self-start rounded-lg bg-teal-700 px-3 py-2 text-sm text-white"
					onClick={async () => {
						await api.saveSettings({ siteName, defaultTheme: theme, defaultLocale: locale });
						await refresh();
					}}
				>
					{t("settings.save")}
				</button>
			</section>
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
						await api.changePassword(current, next);
						setCurrent("");
						setNext("");
						setMsg(t("settings.changed"));
					}}
				>
					{t("settings.password")}
				</button>
				{msg && <p className="text-sm text-teal-700">{msg}</p>}
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
