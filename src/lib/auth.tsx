import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PublicSite } from "@shared/types";
import { api } from "./api";

type AuthState = {
	ready: boolean;
	admin: boolean;
	site: PublicSite | null;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);
	const [admin, setAdmin] = useState(false);
	const [site, setSite] = useState<PublicSite | null>(null);

	const refresh = async () => {
		try {
			const me = await api.me();
			setAdmin(me.admin);
			setSite(me.site);
		} catch {
			setAdmin(false);
		} finally {
			setReady(true);
		}
	};

	useEffect(() => {
		void refresh();
	}, []);

	const logout = async () => {
		await api.logout();
		setAdmin(false);
	};

	return <AuthContext.Provider value={{ ready, admin, site, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
