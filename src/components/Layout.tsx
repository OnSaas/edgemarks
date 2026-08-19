import { Menu, Monitor, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { DEFAULT_FEATURES } from "@shared/types";
import { useAuth } from "../lib/auth";
import { LanguageToggle, useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { Button, IconButton, cx } from "./ui";

const navClass = ({ isActive }: { isActive: boolean }) =>
	cx(
		"inline-flex h-9 items-center rounded-lg px-3 text-sm",
		isActive ? "bg-[var(--card)] text-[var(--fg)]" : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--fg)]",
	);

export function Layout({ children }: { children: React.ReactNode }) {
	const t = useT();
	const { admin, site, logout } = useAuth();
	const { mode, setMode } = useTheme();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const name = site?.siteName || t("app.name");
	const features = { ...DEFAULT_FEATURES, ...site?.features };
	const icon = site?.siteIcon || "/favicon.svg";

	useEffect(() => {
		document.title = name;
		const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (link) link.href = icon;
	}, [name, icon]);

	const cycleTheme = () => {
		setMode(mode === "dark" ? "light" : mode === "light" ? "system" : "dark");
	};

	const links = (
		<>
			<NavLink to="/" end className={navClass} onClick={() => setOpen(false)}>
				{t("nav.home")}
			</NavLink>
			{admin && (
				<>
					<NavLink to="/admin" end className={navClass} onClick={() => setOpen(false)}>
						{t("nav.admin")}
					</NavLink>
					<NavLink to="/admin/site" className={navClass} onClick={() => setOpen(false)}>
						{t("nav.site")}
					</NavLink>
					<NavLink to="/admin/import" className={navClass} onClick={() => setOpen(false)}>
						{t("nav.import")}
					</NavLink>
					<NavLink to="/admin/settings" className={navClass} onClick={() => setOpen(false)}>
						{t("nav.settings")}
					</NavLink>
				</>
			)}
		</>
	);

	return (
		<div className="min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
			<header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur">
				<div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
					<NavLink to="/" className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
						<span className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-teal-700 text-xs text-teal-50">
							{site?.siteIcon ? <img src={site.siteIcon} alt="" className="h-full w-full object-cover" /> : <span className="m-auto">E</span>}
						</span>
						<span className="truncate">{name}</span>
					</NavLink>
					<nav className="ml-1 hidden items-center gap-0.5 lg:flex">{links}</nav>
					<div className="ml-auto flex items-center gap-1.5">
						{features.showLanguageToggle && <LanguageToggle />}
						{features.showThemeToggle && (
							<IconButton onClick={cycleTheme} aria-label={mode}>
								{mode === "dark" ? <Moon size={16} /> : mode === "light" ? <Sun size={16} /> : <Monitor size={16} />}
							</IconButton>
						)}
						{admin ? (
							<Button
								variant="secondary"
								className="hidden sm:inline-flex"
								onClick={async () => {
									await logout();
									navigate("/");
								}}
							>
								{t("nav.logout")}
							</Button>
						) : features.showLoginButton ? (
							<NavLink to="/login" className={cx("inline-flex h-9 items-center rounded-lg bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800")}>
								{t("nav.login")}
							</NavLink>
						) : null}
						<IconButton className="lg:hidden" aria-label={t("nav.menu")} onClick={() => setOpen((v) => !v)}>
							{open ? <X size={16} /> : <Menu size={16} />}
						</IconButton>
					</div>
				</div>
				{open && (
					<nav className="grid gap-1 border-t border-[var(--line)] px-3 py-2 lg:hidden">
						{links}
						{admin && (
							<Button
								variant="ghost"
								className="justify-start sm:hidden"
								onClick={async () => {
									await logout();
									setOpen(false);
									navigate("/");
								}}
							>
								{t("nav.logout")}
							</Button>
						)}
					</nav>
				)}
			</header>
			<main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6">{children}</main>
		</div>
	);
}
