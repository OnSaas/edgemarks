import { Hono } from "hono";
import type { AppEnv } from "./auth";
import { filterPublicBookmarks, filterPublicGroups, getBookmarks, getConfig, getGroups, sortByOrder, toPublicSite } from "../store";

export const publicApi = new Hono<AppEnv>();

publicApi.get("/site", async (c) => {
	const config = await getConfig(c.env);
	return c.json(toPublicSite(config));
});

publicApi.get("/groups", async (c) => {
	const groups = filterPublicGroups(await getGroups(c.env));
	return c.json(sortByOrder(groups));
});

publicApi.get("/bookmarks", async (c) => {
	const q = (c.req.query("q") ?? "").trim().toLowerCase();
	const groupId = c.req.query("groupId") ?? "";
	const tag = (c.req.query("tag") ?? "").trim().toLowerCase();
	const groups = filterPublicGroups(await getGroups(c.env));
	const publicIds = new Set(groups.map((g) => g.id));
	let bookmarks = filterPublicBookmarks(await getBookmarks(c.env), publicIds);
	if (groupId === "ungrouped") bookmarks = bookmarks.filter((b) => b.groupId === null);
	else if (groupId) bookmarks = bookmarks.filter((b) => b.groupId === groupId);
	if (tag) bookmarks = bookmarks.filter((b) => b.tags.some((t) => t.toLowerCase() === tag));
	if (q) {
		bookmarks = bookmarks.filter((b) =>
			[b.title, b.url, b.description ?? "", b.tags.join(" ")].join(" ").toLowerCase().includes(q),
		);
	}
	return c.json(sortByOrder(bookmarks));
});
