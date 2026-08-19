import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

export function SetupPage() {
	const t = useT();
	const { site, refresh } = useAuth();
	const navigate = useNavigate();
	const [siteName, setSiteName] = useState("EdgeBookmarks");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	if (site?.setupComplete) return <Navigate to="/login" replace />;

	return (
		<div className="mx-auto mt-10 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
			<h1 className="text-xl font-semibold">{t("auth.setupTitle")}</h1>
			<p className="mt-2 text-sm text-[var(--muted)]">{t("auth.setupHint")}</p>
			<form
				className="mt-4 grid gap-3"
				onSubmit={async (e) => {
					e.preventDefault();
					setBusy(true);
					setError("");
					try {
						await api.setup(password, siteName);
						await refresh();
						navigate("/admin");
					} catch {
						setError(t("error.generic"));
					} finally {
						setBusy(false);
					}
				}}
			>
				<label className="grid gap-1 text-sm">
					{t("auth.siteName")}
					<input
						required
						className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
						value={siteName}
						onChange={(e) => setSiteName(e.target.value)}
					/>
				</label>
				<label className="grid gap-1 text-sm">
					{t("auth.password")}
					<input
						type="password"
						required
						minLength={8}
						className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
						placeholder={t("auth.passwordHint")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</label>
				{error && <p className="text-sm text-red-500">{error}</p>}
				<button disabled={busy} className="rounded-lg bg-teal-700 py-2 text-sm text-white disabled:opacity-60" type="submit">
					{t("auth.create")}
				</button>
			</form>
		</div>
	);
}
