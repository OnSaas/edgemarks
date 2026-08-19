import { Moon, Sun, Monitor } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LanguageToggle, useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export function Layout({ children }: { children: React.ReactNode }) {
	const t = useT();
	const { admin, site, logout } = useAuth();
	const { mode, setMode } = useTheme();
	const navigate = useNavigate();
	const name = site?.siteName || t("app.name");

	const cycleTheme = () => {
		setMode(mode === "dark" ? "light" : mode === "light" ? "system" : "dark");
	};

	return (
		<div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
			<header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur">
				<div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
					<NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-xs text-teal-50">
							E
						</span>
						<span className="hidden sm:inline">{name}</span>
					</NavLink>
					<nav className="ml-2 flex items-center gap-1 text-sm">
						<NavLink
							to="/"
							end
							className={({ isActive }) =>
								`rounded-lg px-2.5 py-1.5 ${isActive ? "bg-[var(--card)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`
							}
						>
							{t("nav.home")}
						</NavLink>
						{admin && (
							<>
								<NavLink
									to="/admin"
									end
									className={({ isActive }) =>
										`rounded-lg px-2.5 py-1.5 ${isActive ? "bg-[var(--card)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`
									}
								>
									{t("nav.admin")}
								</NavLink>
								<NavLink
									to="/admin/import"
									className={({ isActive }) =>
										`hidden rounded-lg px-2.5 py-1.5 sm:inline ${isActive ? "bg-[var(--card)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`
									}
								>
									{t("nav.import")}
								</NavLink>
								<NavLink
									to="/admin/settings"
									className={({ isActive }) =>
										`hidden rounded-lg px-2.5 py-1.5 sm:inline ${isActive ? "bg-[var(--card)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`
									}
								>
									{t("nav.settings")}
								</NavLink>
							</>
						)}
					</nav>
					<div className="ml-auto flex items-center gap-2">
						<LanguageToggle />
						<button
							type="button"
							onClick={cycleTheme}
							className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] hover:bg-[var(--soft)]"
							aria-label={mode}
						>
							{mode === "dark" ? <Moon size={16} /> : mode === "light" ? <Sun size={16} /> : <Monitor size={16} />}
						</button>
						{admin ? (
							<button
								type="button"
								className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm hover:bg-[var(--soft)]"
								onClick={async () => {
									await logout();
									navigate("/");
								}}
							>
								{t("nav.logout")}
							</button>
						) : (
							<NavLink to="/login" className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800">
								{t("nav.login")}
							</NavLink>
						)}
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
		</div>
	);
}
