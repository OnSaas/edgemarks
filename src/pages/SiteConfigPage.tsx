import { Switch } from "@base-ui/react/switch";
import { useEffect, useState } from "react";
import type { Locale, SiteFeatures, ThemeMode } from "@shared/types";
import { DEFAULT_FEATURES } from "@shared/types";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

const ICON_MAX = 200_000;

function FeatureSwitch({
	label,
	hint,
	checked,
	onCheckedChange,
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onCheckedChange: (v: boolean) => void;
}) {
	return (
		<label className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] px-3 py-2.5">
			<span>
				<span className="block text-sm">{label}</span>
				{hint && <span className="mt-0.5 block text-xs text-[var(--muted)]">{hint}</span>}
			</span>
			<Switch.Root
				checked={checked}
				onCheckedChange={onCheckedChange}
				className="relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full bg-zinc-400 data-checked:bg-teal-700"
			>
				<Switch.Thumb className="h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-checked:translate-x-[18px]" />
			</Switch.Root>
		</label>
	);
}

export function SiteConfigPage() {
	const t = useT();
	const { refresh } = useAuth();
	const [siteName, setSiteName] = useState("");
	const [siteDescription, setSiteDescription] = useState("");
	const [siteIcon, setSiteIcon] = useState("");
	const [theme, setTheme] = useState<ThemeMode>("dark");
	const [locale, setLocale] = useState<Locale>("zh");
	const [features, setFeatures] = useState<SiteFeatures>(DEFAULT_FEATURES);
	const [msg, setMsg] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		void api.settings().then((s) => {
			setSiteName(s.siteName);
			setSiteDescription(s.siteDescription ?? "");
			setSiteIcon(s.siteIcon ?? "");
			setTheme(s.defaultTheme);
			setLocale(s.defaultLocale);
			setFeatures({ ...DEFAULT_FEATURES, ...s.features });
		});
	}, []);

	const setFeature = (key: keyof SiteFeatures, value: boolean) => {
		setFeatures((prev) => ({ ...prev, [key]: value }));
	};

	const onPickIcon = async (file: File | undefined) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setError(t("settings.iconInvalid"));
			return;
		}
		if (file.size > ICON_MAX) {
			setError(t("settings.iconTooLarge"));
			return;
		}
		const data = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result ?? ""));
			reader.onerror = () => reject(new Error("read"));
			reader.readAsDataURL(file);
		});
		setSiteIcon(data);
		setError("");
	};

	return (
		<div className="mx-auto grid max-w-xl gap-6">
			<h1 className="text-2xl font-semibold">{t("nav.site")}</h1>

			<section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
				<h2 className="font-medium">{t("settings.identity")}</h2>
				<label className="grid gap-1 text-sm">
					{t("auth.siteName")}
					<input className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
				</label>
				<label className="grid gap-1 text-sm">
					{t("settings.description")}
					<textarea
						rows={2}
						maxLength={240}
						className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
						value={siteDescription}
						onChange={(e) => setSiteDescription(e.target.value)}
					/>
				</label>
				<div className="grid gap-2 text-sm">
					<span>{t("settings.icon")}</span>
					<div className="flex items-center gap-3">
						<span className="inline-flex h-12 w-12 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg)]">
							{siteIcon ? <img src={siteIcon} alt="" className="h-full w-full object-cover" /> : <span className="m-auto text-xs text-[var(--muted)]">E</span>}
						</span>
						<label className="cursor-pointer rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm">
							{t("settings.iconUpload")}
							<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={(e) => void onPickIcon(e.target.files?.[0])} />
						</label>
						{siteIcon && (
							<button type="button" className="text-sm text-[var(--muted)] hover:text-[var(--fg)]" onClick={() => setSiteIcon("")}>
								{t("settings.iconClear")}
							</button>
						)}
					</div>
					<input
						placeholder={t("settings.iconUrl")}
						className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
						value={siteIcon.startsWith("data:") ? "" : siteIcon}
						onChange={(e) => setSiteIcon(e.target.value.trim())}
					/>
					<p className="text-xs text-[var(--muted)]">{t("settings.iconHint")}</p>
				</div>
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
			</section>

			<section className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
				<h2 className="font-medium">{t("settings.features")}</h2>
				<p className="text-xs text-[var(--muted)]">{t("settings.featuresHint")}</p>
				<FeatureSwitch
					label={t("settings.feat.login")}
					hint={t("settings.feat.loginHint")}
					checked={features.showLoginButton}
					onCheckedChange={(v) => setFeature("showLoginButton", v)}
				/>
				<FeatureSwitch label={t("settings.feat.lang")} checked={features.showLanguageToggle} onCheckedChange={(v) => setFeature("showLanguageToggle", v)} />
				<FeatureSwitch label={t("settings.feat.theme")} checked={features.showThemeToggle} onCheckedChange={(v) => setFeature("showThemeToggle", v)} />
				<FeatureSwitch label={t("settings.feat.search")} checked={features.showSearch} onCheckedChange={(v) => setFeature("showSearch", v)} />
				<FeatureSwitch label={t("settings.feat.tags")} checked={features.showTags} onCheckedChange={(v) => setFeature("showTags", v)} />
			</section>

			{error && <p className="text-sm text-red-500">{error}</p>}
			{msg && <p className="text-sm text-teal-700">{msg}</p>}
			<button
				type="button"
				disabled={busy}
				className="justify-self-start rounded-lg bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-60"
				onClick={async () => {
					setBusy(true);
					setError("");
					setMsg("");
					try {
						await api.saveSettings({ siteName, siteDescription, siteIcon, defaultTheme: theme, defaultLocale: locale, features });
						await refresh();
						setMsg(t("settings.saved"));
					} catch (e) {
						const code = e instanceof Error ? e.message : "";
						setError(code === "icon_too_large" ? t("settings.iconTooLarge") : t("error.generic"));
					} finally {
						setBusy(false);
					}
				}}
			>
				{t("settings.save")}
			</button>
		</div>
	);
}
