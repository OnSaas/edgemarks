import { useEffect, useState } from "react";
import { Button, Field, Input, PageTitle, Panel } from "../components/ui";
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
		<div className="mx-auto grid max-w-xl gap-5">
			<PageTitle>{t("settings.title")}</PageTitle>
			{error && <p className="text-sm text-red-500">{error}</p>}
			{msg && <p className="text-sm text-teal-700">{msg}</p>}
			<Panel title={t("settings.password")}>
				<Field label={t("settings.current")}>
					<Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
				</Field>
				<Field label={t("settings.next")}>
					<Input type="password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
				</Field>
				<Button
					type="button"
					variant="secondary"
					className="w-fit"
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
				</Button>
			</Panel>
			<Panel title={t("settings.bookmarklet")}>
				<p className="text-sm text-[var(--muted)]">{t("settings.bookmarkletHint")}</p>
				{href && (
					<a href={href} className="inline-flex h-9 w-fit items-center rounded-lg bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800">
						{t("settings.bookmarkletBtn")}
					</a>
				)}
			</Panel>
		</div>
	);
}
