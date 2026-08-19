import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/i18n";

export function LoginPage() {
	const t = useT();
	const { admin, refresh } = useAuth();
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	if (admin) return <Navigate to="/admin" replace />;

	return (
		<div className="mx-auto mt-10 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
			<h1 className="text-xl font-semibold">{t("auth.loginTitle")}</h1>
			<form
				className="mt-4 grid gap-3"
				onSubmit={async (e) => {
					e.preventDefault();
					setBusy(true);
					setError("");
					try {
						await api.login(password);
						await refresh();
						navigate("/admin");
					} catch {
						setError(t("auth.invalid"));
					} finally {
						setBusy(false);
					}
				}}
			>
				<label className="grid gap-1 text-sm">
					{t("auth.password")}
					<input
						type="password"
						required
						autoFocus
						className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</label>
				{error && <p className="text-sm text-red-500">{error}</p>}
				<button disabled={busy} className="rounded-lg bg-teal-700 py-2 text-sm text-white disabled:opacity-60" type="submit">
					{t("auth.signIn")}
				</button>
			</form>
		</div>
	);
}
