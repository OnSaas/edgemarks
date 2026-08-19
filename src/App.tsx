import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./lib/auth";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { ImportPage } from "./pages/ImportPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SetupPage } from "./pages/SetupPage";
import { SiteConfigPage } from "./pages/SiteConfigPage";

function Guard({ children }: { children: React.ReactNode }) {
	const { ready, admin, site } = useAuth();
	if (!ready) return null;
	if (site && !site.setupComplete) return <Navigate to="/setup" replace />;
	if (!admin) return <Navigate to="/login" replace />;
	return children;
}

export default function App() {
	const { ready, site } = useAuth();
	if (!ready) {
		return <div className="grid min-h-screen place-items-center text-sm text-zinc-500">EdgeBookmarks</div>;
	}
	return (
		<Layout>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/login" element={site && !site.setupComplete ? <Navigate to="/setup" replace /> : <LoginPage />} />
				<Route path="/setup" element={<SetupPage />} />
				<Route
					path="/admin"
					element={
						<Guard>
							<AdminPage />
						</Guard>
					}
				/>
				<Route
					path="/admin/add"
					element={
						<Guard>
							<AdminPage />
						</Guard>
					}
				/>
				<Route
					path="/admin/import"
					element={
						<Guard>
							<ImportPage />
						</Guard>
					}
				/>
				<Route
					path="/admin/site"
					element={
						<Guard>
							<SiteConfigPage />
						</Guard>
					}
				/>
				<Route
					path="/admin/settings"
					element={
						<Guard>
							<SettingsPage />
						</Guard>
					}
				/>
			</Routes>
		</Layout>
	);
}
