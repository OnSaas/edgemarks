import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Field, Input, PageTitle, Panel } from "../components/ui";
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
		<Panel className="mx-auto mt-8 max-w-sm p-5 sm:mt-10 sm:p-6">
			<PageTitle>{t("auth.setupTitle")}</PageTitle>
			<p className="text-sm text-[var(--muted)]">{t("auth.setupHint")}</p>
			<form
				className="grid gap-3"
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
				<Field label={t("auth.siteName")}>
					<Input required value={siteName} onChange={(e) => setSiteName(e.target.value)} />
				</Field>
				<Field label={t("auth.password")}>
					<Input type="password" required minLength={8} placeholder={t("auth.passwordHint")} value={password} onChange={(e) => setPassword(e.target.value)} />
				</Field>
				{error && <p className="text-sm text-red-500">{error}</p>}
				<Button disabled={busy} type="submit" className="w-full">
					{t("auth.create")}
				</Button>
			</form>
		</Panel>
	);
}
