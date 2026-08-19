export type Locale = "zh" | "en";
export type ThemeMode = "system" | "dark" | "light";

export type SiteFeatures = {
	showLoginButton: boolean;
	showLanguageToggle: boolean;
	showThemeToggle: boolean;
	showSearch: boolean;
	showTags: boolean;
};

export const DEFAULT_FEATURES: SiteFeatures = {
	showLoginButton: true,
	showLanguageToggle: true,
	showThemeToggle: true,
	showSearch: true,
	showTags: true,
};

export type Bookmark = {
	id: string;
	title: string;
	url: string;
	description?: string;
	tags: string[];
	groupId: string | null;
	isPublic: boolean;
	favicon?: string;
	createdAt: number;
	updatedAt: number;
	sortOrder: number;
	notes?: string;
};

export type Group = {
	id: string;
	name: string;
	isPublic: boolean;
	parentId: string | null;
	sortOrder: number;
	icon?: string;
};

export type SiteConfig = {
	siteName: string;
	siteIcon: string;
	siteDescription: string;
	defaultLocale: Locale;
	defaultTheme: ThemeMode;
	passwordHash: string;
	setupComplete: boolean;
	updatedAt: number;
	features: SiteFeatures;
};

export type PublicSite = {
	siteName: string;
	siteIcon: string;
	siteDescription: string;
	defaultLocale: Locale;
	defaultTheme: ThemeMode;
	setupComplete: boolean;
	features: SiteFeatures;
};

export type BackupPayload = {
	version: 1;
	exportedAt: number;
	siteName: string;
	groups: Group[];
	bookmarks: Bookmark[];
};

export type ImportResult = {
	groupsCreated: number;
	bookmarksCreated: number;
	bookmarksUpdated: number;
	skipped: number;
};

export type SessionUser = {
	role: "admin";
};

export function mergeFeatures(raw?: Partial<SiteFeatures> | null): SiteFeatures {
	return { ...DEFAULT_FEATURES, ...(raw ?? {}) };
}
