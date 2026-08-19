import { describe, expect, it } from "vitest";
import { detectAndParse, mergeImport, toNetscapeHtml } from "../worker/import-export";
import type { Bookmark, Group } from "../shared/types";

describe("import-export", () => {
	it("parses netscape html folders and links", () => {
		const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>Work</H3>
<DL><p>
<DT><A HREF="https://example.com">Example</A>
</DL><p>
</DL><p>`;
		const parsed = detectAndParse(html);
		expect(parsed.groups.map((g) => g.name)).toEqual(["Work"]);
		expect(parsed.bookmarks[0]?.title).toBe("Example");
		expect(parsed.bookmarks[0]?.url).toBe("https://example.com/");
		expect(parsed.bookmarks[0]?.groupName).toBe("Work");
	});

	it("parses chrome/edge exported html", () => {
		const html = `${"\uFEFF"}<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1" PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
        <DT><A href="https://example.com/path?a=1&amp;b=2" ADD_DATE="1" ICON="data:image/png;base64,xxx">Example</A>
        <DT><H3>Work</H3>
        <DL><p>
            <DT><A HREF="https://workers.cloudflare.com/">CF</A>
            <DT><A HREF="javascript:void(0)">skip me</A>
        </DL><p>
    </DL><p>
</DL><p>`;
		const parsed = detectAndParse(html);
		expect(parsed.groups.map((g) => g.name)).toEqual(["Work"]);
		expect(parsed.bookmarks).toHaveLength(2);
		expect(parsed.bookmarks[0]?.url).toBe("https://example.com/path?a=1&b=2");
		expect(parsed.bookmarks[0]?.groupName).toBeNull();
		expect(parsed.bookmarks[1]?.groupName).toBe("Work");
	});

	it("parses chrome bookmark json", () => {
		const parsed = detectAndParse(
			JSON.stringify({
				roots: {
					bookmark_bar: {
						children: [{ type: "url", name: "CF", url: "https://workers.cloudflare.com" }],
					},
				},
			}),
		);
		expect(parsed.bookmarks).toHaveLength(1);
		expect(parsed.bookmarks[0]?.url).toBe("https://workers.cloudflare.com/");
	});

	it("dedupes by url and can update title", () => {
		const existingBookmarks: Bookmark[] = [
			{
				id: "1",
				title: "Old",
				url: "https://example.com/",
				tags: [],
				groupId: null,
				isPublic: false,
				createdAt: 1,
				updatedAt: 1,
				sortOrder: 0,
			},
		];
		const existingGroups: Group[] = [];
		const parsed = detectAndParse(
			JSON.stringify({
				version: 1,
				exportedAt: 1,
				siteName: "x",
				groups: [],
				bookmarks: [
					{
						id: "x",
						title: "New",
						url: "https://example.com",
						tags: ["a"],
						groupId: null,
						isPublic: true,
						createdAt: 2,
						updatedAt: 2,
						sortOrder: 0,
					},
				],
			}),
		);
		const merged = mergeImport(existingGroups, existingBookmarks, parsed, {
			makePublic: false,
			updateExisting: true,
		});
		expect(merged.result.bookmarksCreated).toBe(0);
		expect(merged.result.bookmarksUpdated).toBe(1);
		expect(merged.bookmarks[0]?.title).toBe("New");
		expect(merged.bookmarks[0]?.tags).toEqual(["a"]);
	});

	it("roundtrips netscape html", () => {
		const groups: Group[] = [{ id: "g1", name: "Work", isPublic: true, parentId: null, sortOrder: 0 }];
		const bookmarks: Bookmark[] = [
			{
				id: "b1",
				title: "Example",
				url: "https://example.com/",
				tags: [],
				groupId: "g1",
				isPublic: true,
				createdAt: 1,
				updatedAt: 1,
				sortOrder: 0,
			},
		];
		const html = toNetscapeHtml(groups, bookmarks);
		const parsed = detectAndParse(html);
		expect(parsed.bookmarks).toHaveLength(1);
		expect(parsed.groups[0]?.name).toBe("Work");
	});
});
