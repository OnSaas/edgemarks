import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Field, Input, PageTitle, Panel } from "../components/ui";
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
		<Panel className="mx-auto mt-8 max-w-sm p-5 sm:mt-10 sm:p-6">
			<PageTitle>{t("auth.loginTitle")}</PageTitle>
			<form
				className="grid gap-3"
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
				<Field label={t("auth.password")}>
					<Input type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
				</Field>
				{error && <p className="text-sm text-red-500">{error}</p>}
				<Button disabled={busy} type="submit" className="w-full">
					{t("auth.signIn")}
				</Button>
			</form>
		</Panel>
	);
}
