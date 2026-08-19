import { useEffect, useState } from "react";
import type { Locale, SiteFeatures, ThemeMode } from "@shared/types";
import { DEFAULT_FEATURES } from "@shared/types";
import { Button, Field, Input, PageTitle, Panel, Select, Toggle } from "../components/ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

const ICON_MAX = 200 * 1024;

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

	const setFlag = <K extends keyof SiteFeatures>(key: K, value: SiteFeatures[K]) => {
		setFeatures((prev) => ({ ...prev, [key]: value }));
	};

	const onIconFile = async (file?: File) => {
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
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
		setSiteIcon(data);
		setError("");
	};

	return (
		<div className="mx-auto grid max-w-xl gap-5">
			<PageTitle>{t("settings.identity")}</PageTitle>
			{error && <p className="text-sm text-red-500">{error}</p>}
			{msg && <p className="text-sm text-teal-700">{msg}</p>}
			<Panel>
				<Field label={t("auth.siteName")}>
					<Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
				</Field>
				<Field label={t("settings.description")}>
					<Input value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} />
				</Field>
				<div className="grid gap-1.5 text-sm">
					<span className="text-[var(--muted)]">{t("settings.icon")}</span>
					<div className="flex flex-wrap items-center gap-3">
						<span className="inline-flex h-12 w-12 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--soft)]">
							{siteIcon ? <img src={siteIcon} alt="" className="h-full w-full object-cover" /> : <span className="m-auto text-xs text-[var(--muted)]">E</span>}
						</span>
						<label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 text-sm font-medium hover:bg-[var(--soft)]">
							{t("settings.iconUpload")}
							<input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="hidden" onChange={(e) => void onIconFile(e.target.files?.[0])} />
						</label>
						{siteIcon && (
							<Button type="button" variant="ghost" onClick={() => setSiteIcon("")}>
								{t("settings.iconClear")}
							</Button>
						)}
					</div>
					<Input placeholder={t("settings.iconUrl")} value={siteIcon.startsWith("data:") ? "" : siteIcon} onChange={(e) => setSiteIcon(e.target.value)} />
					<p className="text-xs text-[var(--muted)]">{t("settings.iconHint")}</p>
				</div>
				<Field label={t("settings.theme")}>
					<Select value={theme} onChange={(e) => setTheme(e.target.value as ThemeMode)}>
						<option value="system">{t("theme.system")}</option>
						<option value="dark">{t("theme.dark")}</option>
						<option value="light">{t("theme.light")}</option>
					</Select>
				</Field>
				<Field label={t("settings.locale")}>
					<Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
						<option value="zh">简体中文</option>
						<option value="en">English</option>
					</Select>
				</Field>
			</Panel>
			<Panel title={t("settings.features")}>
				<p className="text-sm text-[var(--muted)]">{t("settings.featuresHint")}</p>
				{(
					[
						["showLoginButton", "settings.feat.login", "settings.feat.loginHint"],
						["showLanguageToggle", "settings.feat.lang", ""],
						["showThemeToggle", "settings.feat.theme", ""],
						["showSearch", "settings.feat.search", ""],
						["showTags", "settings.feat.tags", ""],
					] as const
				).map(([key, label, hint]) => (
					<label key={key} className="flex min-h-9 items-center justify-between gap-3 text-sm">
						<span>
							{t(label)}
							{hint && <span className="mt-0.5 block text-xs text-[var(--muted)]">{t(hint)}</span>}
						</span>
						<Toggle checked={features[key]} onCheckedChange={(v) => setFlag(key, v)} />
					</label>
				))}
			</Panel>
			<Button
				type="button"
				disabled={busy}
				className="w-fit"
				onClick={async () => {
					setBusy(true);
					setError("");
					setMsg("");
					try {
						await api.saveSettings({ siteName, siteDescription, siteIcon, defaultTheme: theme, defaultLocale: locale, features });
						await refresh();
						setMsg(t("settings.saved"));
					} catch {
						setError(t("error.generic"));
					} finally {
						setBusy(false);
					}
				}}
			>
				{t("settings.save")}
			</Button>
		</div>
	);
}
