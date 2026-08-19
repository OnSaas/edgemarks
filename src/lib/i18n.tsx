import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const en = {
	"app.name": "EdgeBookmarks",
	"nav.home": "Bookmarks",
	"nav.admin": "Manage",
	"nav.site": "Site",
	"nav.login": "Sign in",
	"nav.logout": "Sign out",
	"nav.settings": "Settings",
	"nav.import": "Import / Export",
	"search.placeholder": "Search title, URL, tags…",
	"filter.all": "All",
	"filter.ungrouped": "Ungrouped",
	"empty.public": "No public bookmarks yet.",
	"empty.admin": "No bookmarks. Add one or import a file.",
	"empty.search": "No matches.",
	"auth.loginTitle": "Admin sign in",
	"auth.password": "Password",
	"auth.signIn": "Sign in",
	"auth.invalid": "Incorrect password.",
	"auth.setupTitle": "First-run setup",
	"auth.setupHint": "Set the only admin password. Keep it somewhere safe.",
	"auth.siteName": "Site name",
	"auth.create": "Create site",
	"auth.passwordHint": "At least 8 characters",
	"bookmark.add": "Add bookmark",
	"bookmark.edit": "Edit bookmark",
	"bookmark.title": "Title",
	"bookmark.url": "URL",
	"bookmark.desc": "Description",
	"bookmark.tags": "Tags",
	"bookmark.tagsHint": "Comma separated",
	"bookmark.group": "Group",
	"bookmark.notes": "Private notes",
	"bookmark.public": "Public",
	"bookmark.save": "Save",
	"bookmark.delete": "Delete",
	"bookmark.cancel": "Cancel",
	"bookmark.open": "Open",
	"group.add": "New group",
	"group.name": "Group name",
	"group.delete": "Delete group",
	"group.empty": "No groups yet.",
	"batch.public": "Make public",
	"batch.private": "Make private",
	"batch.selected": "{n} selected",
	"import.title": "Import / Export / Backup",
	"import.paste": "Paste Netscape HTML, Chrome JSON, or backup JSON",
	"import.file": "Choose file",
	"import.run": "Import",
	"import.makePublic": "Mark imported items public",
	"import.result": "Created {created} bookmarks, updated {updated}, skipped {skipped}, groups +{groups}.",
	"export.json": "Export JSON",
	"export.html": "Export HTML",
	"export.public": "Public only",
	"backup.r2": "Backup to R2",
	"backup.restore": "Restore from file",
	"backup.list": "R2 backups",
	"backup.none": "R2 is not bound. Download a JSON backup instead.",
	"settings.title": "Site settings",
	"settings.save": "Save settings",
	"settings.saved": "Settings saved.",
	"settings.identity": "Site identity",
	"settings.description": "Tagline",
	"settings.icon": "Site icon",
	"settings.iconUpload": "Upload",
	"settings.iconClear": "Clear",
	"settings.iconUrl": "Or paste an image URL",
	"settings.iconHint": "PNG / SVG / WebP, under 200 KB. Used in the header and as favicon.",
	"settings.iconTooLarge": "Icon is larger than 200 KB.",
	"settings.iconInvalid": "Please choose an image file.",
	"settings.features": "Public features",
	"settings.featuresHint": "These only affect visitors. Admins always see full controls. Login stays available at /login even if the button is hidden.",
	"settings.feat.login": "Show sign-in button",
	"settings.feat.loginHint": "Hide this if you want a public-only look. /login still works.",
	"settings.feat.lang": "Show language toggle",
	"settings.feat.theme": "Show theme toggle",
	"settings.feat.search": "Show search box",
	"settings.feat.tags": "Show tag filters",
	"settings.theme": "Default theme",
	"settings.locale": "Default language",
	"settings.password": "Change password",
	"settings.current": "Current password",
	"settings.next": "New password",
	"settings.changed": "Password updated.",
	"settings.bookmarklet": "Bookmarklet",
	"settings.bookmarkletHint": "Drag this to the bookmarks bar. Click it on any page to add it here.",
	"settings.bookmarkletBtn": "Add to EdgeBookmarks",
	"theme.system": "System",
	"theme.dark": "Dark",
	"theme.light": "Light",
	"lang.switch": "中文",
	"error.generic": "Something went wrong.",
	"error.duplicate": "This URL already exists.",
	"confirm.delete": "Delete this item? This cannot be undone.",
	"confirm.restore": "Restore this backup? Current data will be replaced.",
	"sort.hint": "Drag the handle to reorder.",
	"count.bookmarks": "{n} bookmarks",
	"count.tags": "Tags",
} satisfies Record<string, string>;

const zh: Record<string, string> = {
	"app.name": "EdgeBookmarks",
	"nav.home": "书签",
	"nav.admin": "管理",
	"nav.site": "站点",
	"nav.login": "登录",
	"nav.logout": "退出",
	"nav.settings": "设置",
	"nav.import": "导入导出",
	"search.placeholder": "搜索标题、链接、标签…",
	"filter.all": "全部",
	"filter.ungrouped": "未分组",
	"empty.public": "还没有公开书签。",
	"empty.admin": "还没有书签。先添加一条，或导入文件。",
	"empty.search": "没有匹配结果。",
	"auth.loginTitle": "管理员登录",
	"auth.password": "密码",
	"auth.signIn": "登录",
	"auth.invalid": "密码不正确。",
	"auth.setupTitle": "首次设置",
	"auth.setupHint": "设置唯一管理员密码，请自行妥善保存。",
	"auth.siteName": "站点名称",
	"auth.create": "创建站点",
	"auth.passwordHint": "至少 8 位",
	"bookmark.add": "添加书签",
	"bookmark.edit": "编辑书签",
	"bookmark.title": "标题",
	"bookmark.url": "链接",
	"bookmark.desc": "描述",
	"bookmark.tags": "标签",
	"bookmark.tagsHint": "逗号分隔",
	"bookmark.group": "分组",
	"bookmark.notes": "私有备注",
	"bookmark.public": "公开",
	"bookmark.save": "保存",
	"bookmark.delete": "删除",
	"bookmark.cancel": "取消",
	"bookmark.open": "打开",
	"group.add": "新建分组",
	"group.name": "分组名称",
	"group.delete": "删除分组",
	"group.empty": "还没有分组。",
	"batch.public": "设为公开",
	"batch.private": "设为私有",
	"batch.selected": "已选 {n} 项",
	"import.title": "导入 / 导出 / 备份",
	"import.paste": "粘贴 Netscape HTML、Chrome JSON 或备份 JSON",
	"import.file": "选择文件",
	"import.run": "导入",
	"import.makePublic": "导入项默认公开",
	"import.result": "新建 {created} 条，更新 {updated} 条，跳过 {skipped} 条，分组 +{groups}。",
	"export.json": "导出 JSON",
	"export.html": "导出 HTML",
	"export.public": "仅公开",
	"backup.r2": "备份到 R2",
	"backup.restore": "从文件恢复",
	"backup.list": "R2 备份",
	"backup.none": "未绑定 R2，请先下载 JSON 备份。",
	"settings.title": "站点设置",
	"settings.save": "保存设置",
	"settings.saved": "设置已保存。",
	"settings.identity": "站点信息",
	"settings.description": "站点简介",
	"settings.icon": "站点图标",
	"settings.iconUpload": "上传",
	"settings.iconClear": "清除",
	"settings.iconUrl": "或粘贴图片 URL",
	"settings.iconHint": "PNG / SVG / WebP，不超过 200 KB。用于顶栏和 favicon。",
	"settings.iconTooLarge": "图标超过 200 KB。",
	"settings.iconInvalid": "请选择图片文件。",
	"settings.features": "公开功能",
	"settings.featuresHint": "只影响访客。管理员始终看到完整功能。即使隐藏登录按钮，仍可通过 /login 进入。",
	"settings.feat.login": "显示登录按钮",
	"settings.feat.loginHint": "想做成纯公开页就关掉。/login 仍然可用。",
	"settings.feat.lang": "显示语言切换",
	"settings.feat.theme": "显示主题切换",
	"settings.feat.search": "显示搜索框",
	"settings.feat.tags": "显示标签筛选",
	"settings.theme": "默认主题",
	"settings.locale": "默认语言",
	"settings.password": "修改密码",
	"settings.current": "当前密码",
	"settings.next": "新密码",
	"settings.changed": "密码已更新。",
	"settings.bookmarklet": "书签小工具",
	"settings.bookmarkletHint": "拖到浏览器书签栏。在任意网页点一下即可加入本站。",
	"settings.bookmarkletBtn": "添加到 EdgeBookmarks",
	"theme.system": "跟随系统",
	"theme.dark": "暗色",
	"theme.light": "亮色",
	"lang.switch": "English",
	"error.generic": "出了点问题。",
	"error.duplicate": "这个链接已经存在。",
	"confirm.delete": "确认删除？此操作不可撤销。",
	"confirm.restore": "用这份备份覆盖当前数据？",
	"sort.hint": "拖动手柄可排序。",
	"count.bookmarks": "{n} 条书签",
	"count.tags": "标签",
};

type Dict = Record<string, string>;
export type Locale = "en" | "zh";

const LocaleContext = createContext<{
	locale: Locale;
	setLocale: (l: Locale) => void;
	t: (key: string, params?: Record<string, string | number>) => string;
} | null>(null);

const dicts: Record<Locale, Dict> = { en, zh };

function detectLocale(): Locale {
	if (typeof window === "undefined") return "zh";
	const stored = localStorage.getItem("locale") as Locale | null;
	if (stored === "en" || stored === "zh") return stored;
	return navigator.language.startsWith("zh") ? "zh" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(detectLocale);
	const setLocale = (l: Locale) => {
		setLocaleState(l);
		localStorage.setItem("locale", l);
	};
	useEffect(() => {
		document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
	}, [locale]);
	const t = (key: string, params?: Record<string, string | number>): string => {
		let val = dicts[locale][key] ?? dicts.en[key] ?? key;
		if (params) {
			for (const [k, v] of Object.entries(params)) val = val.replace(`{${k}}`, String(v));
		}
		return val;
	};
	return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useT() {
	const ctx = useContext(LocaleContext);
	if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
	return ctx.t;
}

export function useLocale() {
	const ctx = useContext(LocaleContext);
	if (!ctx) throw new Error("useLocale must be used inside <I18nProvider>");
	return { locale: ctx.locale, setLocale: ctx.setLocale };
}

export function LanguageToggle() {
	const { locale, setLocale } = useLocale();
	return (
		<button
			type="button"
			onClick={() => setLocale(locale === "en" ? "zh" : "en")}
			className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--line)] px-2 text-xs font-medium hover:bg-[var(--soft)]"
		>
			<span className="sm:hidden">{locale === "en" ? "中" : "EN"}</span>
			<span className="hidden sm:inline">{locale === "en" ? "中文" : "English"}</span>
		</button>
	);
}
