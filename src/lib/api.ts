import type { BackupPayload, Bookmark, Group, ImportResult, PublicSite } from "@shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		credentials: "include",
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
		...init,
	});
	if (!res.ok) {
		let error = `http_${res.status}`;
		try {
			const body = (await res.json()) as { error?: string };
			if (body.error) error = body.error;
		} catch {
			/* ignore */
		}
		throw new Error(error);
	}
	const ct = res.headers.get("content-type") ?? "";
	if (ct.includes("application/json")) return (await res.json()) as T;
	return (await res.text()) as T;
}

export const api = {
	me: () => request<{ admin: boolean; site: PublicSite }>("/api/auth/me"),
	login: (password: string) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) }),
	logout: () => request("/api/auth/logout", { method: "POST" }),
	setup: (password: string, siteName: string) =>
		request("/api/auth/setup", { method: "POST", body: JSON.stringify({ password, siteName }) }),
	publicSite: () => request<PublicSite>("/api/public/site"),
	publicGroups: () => request<Group[]>("/api/public/groups"),
	publicBookmarks: (params?: { q?: string; groupId?: string; tag?: string }) => {
		const q = new URLSearchParams();
		if (params?.q) q.set("q", params.q);
		if (params?.groupId) q.set("groupId", params.groupId);
		if (params?.tag) q.set("tag", params.tag);
		const suffix = q.toString() ? `?${q}` : "";
		return request<Bookmark[]>(`/api/public/bookmarks${suffix}`);
	},
	adminBookmarks: (q?: string) => request<Bookmark[]>(`/api/admin/bookmarks${q ? `?q=${encodeURIComponent(q)}` : ""}`),
	createBookmark: (body: Partial<Bookmark>) =>
		request<Bookmark>("/api/admin/bookmarks", { method: "POST", body: JSON.stringify(body) }),
	updateBookmark: (id: string, body: Partial<Bookmark>) =>
		request<Bookmark>(`/api/admin/bookmarks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
	deleteBookmark: (id: string) => request(`/api/admin/bookmarks/${id}`, { method: "DELETE" }),
	reorderBookmarks: (ids: string[]) =>
		request("/api/admin/bookmarks/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
	setVisibility: (ids: string[], isPublic: boolean) =>
		request("/api/admin/bookmarks/visibility", { method: "POST", body: JSON.stringify({ ids, isPublic }) }),
	adminGroups: () => request<Group[]>("/api/admin/groups"),
	createGroup: (body: Partial<Group>) => request<Group>("/api/admin/groups", { method: "POST", body: JSON.stringify(body) }),
	updateGroup: (id: string, body: Partial<Group>) =>
		request<Group>(`/api/admin/groups/${id}`, { method: "PUT", body: JSON.stringify(body) }),
	deleteGroup: (id: string) => request(`/api/admin/groups/${id}`, { method: "DELETE" }),
	reorderGroups: (ids: string[]) => request("/api/admin/groups/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
	importText: (text: string, makePublic: boolean) =>
		request<ImportResult>("/api/admin/import", { method: "POST", body: JSON.stringify({ text, makePublic }) }),
	exportUrl: (format: "json" | "html", scope: "all" | "public") => `/api/admin/export?format=${format}&scope=${scope}`,
	backupR2: () => request<{ key: string }>("/api/admin/backup", { method: "POST" }),
	listBackups: () =>
		request<{ r2: boolean; items: Array<{ key: string; size: number; uploaded: string }> }>("/api/admin/backups"),
	restore: (payload: BackupPayload) => request("/api/admin/restore", { method: "POST", body: JSON.stringify({ payload }) }),
	restoreKey: (key: string) => request("/api/admin/restore", { method: "POST", body: JSON.stringify({ key }) }),
	settings: () => request<PublicSite>("/api/admin/settings"),
	saveSettings: (body: Partial<PublicSite> & { features?: Partial<PublicSite["features"]> }) =>
		request<PublicSite>("/api/admin/settings", { method: "PUT", body: JSON.stringify(body) }),
	changePassword: (current: string, next: string) =>
		request("/api/admin/password", { method: "PUT", body: JSON.stringify({ current, next }) }),
	bookmarklet: () => request<{ href: string }>("/api/admin/bookmarklet"),
};
