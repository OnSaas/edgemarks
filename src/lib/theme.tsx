import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ThemeMode } from "@shared/types";

type Resolved = "dark" | "light";

const ThemeContext = createContext<{
	mode: ThemeMode;
	resolved: Resolved;
	setMode: (m: ThemeMode) => void;
} | null>(null);

function readMode(): ThemeMode {
	if (typeof window === "undefined") return "dark";
	const stored = localStorage.getItem("theme") as ThemeMode | null;
	if (stored === "system" || stored === "dark" || stored === "light") return stored;
	return "dark";
}

function resolve(mode: ThemeMode): Resolved {
	if (mode === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>(readMode);
	const [resolved, setResolved] = useState<Resolved>(() => resolve(readMode()));

	const apply = (next: ThemeMode) => {
		const value = resolve(next);
		setResolved(value);
		document.documentElement.classList.toggle("dark", value === "dark");
	};

	useEffect(() => {
		apply(mode);
		if (mode !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => apply("system");
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [mode]);

	const setMode = (m: ThemeMode) => {
		setModeState(m);
		localStorage.setItem("theme", m);
		apply(m);
	};

	return <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
	return ctx;
}
