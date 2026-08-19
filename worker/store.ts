import type { Bookmark, Group, PublicSite, SiteConfig } from "../shared/types";
import { KEYS, type Env } from "./env";
import { hashPassword } from "./password";

const defaultConfig = (): SiteConfig => ({
	siteName: "EdgeBookmarks",
	defaultLocale: "zh",
	defaultTheme: "dark",
	passwordHash: "",
	setupComplete: false,
	updatedAt: Date.now(),
});

export async function getConfig(env: Env): Promise<SiteConfig> {
	const stored = await env.KV.get<SiteConfig>(KEYS.config, "json");
	const config = stored ?? defaultConfig();
	if (!config.setupComplete && env.ADMIN_PASSWORD) {
		config.passwordHash = await hashPassword(env.ADMIN_PASSWORD, env.JWT_SECRET);
		config.setupComplete = true;
		config.updatedAt = Date.now();
		await putConfig(env, config);
	}
	return config;
}

export async function putConfig(env: Env, config: SiteConfig): Promise<void> {
	await env.KV.put(KEYS.config, JSON.stringify(config));
}

export function toPublicSite(config: SiteConfig): PublicSite {
	return {
		siteName: config.siteName,
		defaultLocale: config.defaultLocale,
		defaultTheme: config.defaultTheme,
		setupComplete: config.setupComplete,
	};
}

export async function getGroups(env: Env): Promise<Group[]> {
	return (await env.KV.get<Group[]>(KEYS.groups, "json")) ?? [];
}

export async function putGroups(env: Env, groups: Group[]): Promise<void> {
	await env.KV.put(KEYS.groups, JSON.stringify(groups));
}

export async function getBookmarks(env: Env): Promise<Bookmark[]> {
	return (await env.KV.get<Bookmark[]>(KEYS.bookmarks, "json")) ?? [];
}

export async function putBookmarks(env: Env, bookmarks: Bookmark[]): Promise<void> {
	await env.KV.put(KEYS.bookmarks, JSON.stringify(bookmarks));
}

export function filterPublicGroups(groups: Group[]): Group[] {
	const publicIds = new Set(groups.filter((g) => g.isPublic).map((g) => g.id));
	return groups.filter((g) => g.isPublic && (!g.parentId || publicIds.has(g.parentId)));
}

export function filterPublicBookmarks(bookmarks: Bookmark[], publicGroupIds: Set<string>): Bookmark[] {
	return bookmarks
		.filter((b) => b.isPublic && (b.groupId === null || publicGroupIds.has(b.groupId)))
		.map((b) => {
			const { notes: _notes, ...rest } = b;
			return rest;
		});
}

export function sortByOrder<T extends { sortOrder: number; createdAt?: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => a.sortOrder - b.sortOrder || (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

export function nextOrder<T extends { sortOrder: number }>(items: T[]): number {
	return items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
}

export function canonicalizeUrl(value: string): string | null {
	try {
		const u = new URL(value.trim());
		if (u.protocol !== "http:" && u.protocol !== "https:") return null;
		return u.href;
	} catch {
		return null;
	}
}

export function isHttpUrl(value: string): boolean {
	return canonicalizeUrl(value) !== null;
}

export function faviconFor(url: string): string {
	try {
		const host = new URL(url).hostname;
		return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
	} catch {
		return "";
	}
}

export function nowId(): string {
	return crypto.randomUUID();
}
