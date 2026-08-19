export interface Env {
	KV: KVNamespace;
	BACKUP?: R2Bucket;
	ASSETS?: Fetcher;
	JWT_SECRET: string;
	ADMIN_PASSWORD?: string;
}

export const KEYS = {
	config: "config",
	groups: "groups",
	bookmarks: "bookmarks",
	backupMeta: "backup:latest",
} as const;

export const COOKIE_NAME = "eb_token";
export const TOKEN_TTL_SEC = 60 * 60 * 24 * 7;
