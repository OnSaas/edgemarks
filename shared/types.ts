export type Locale = "zh" | "en";
export type ThemeMode = "system" | "dark" | "light";

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
	defaultLocale: Locale;
	defaultTheme: ThemeMode;
	passwordHash: string;
	setupComplete: boolean;
	updatedAt: number;
};

export type PublicSite = {
	siteName: string;
	defaultLocale: Locale;
	defaultTheme: ThemeMode;
	setupComplete: boolean;
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
