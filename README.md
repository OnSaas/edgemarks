# EdgeBookmarks

单用户个人书签系统。全量跑在 Cloudflare Workers 上：React SPA + Hono API + Workers KV，无 D1 / Durable Objects。

线上：https://edgemarks.onw.workers.dev

公开访客只能看到 `isPublic=true` 的书签；管理员登录后可管理全部数据、导入导出、备份恢复。

## 技术栈

- Cloudflare Workers + Static Assets
- Hono
- Workers KV（主数据）+ R2（可选备份）
- React 19 + Vite + TypeScript
- @base-ui/react + Tailwind CSS v4
- 自建 JWT（Web Crypto）+ 零依赖 i18n

## 本地开发

```bash
cp .dev.vars.example .dev.vars
# 编辑 JWT_SECRET
pnpm install
pnpm dev
```

首次打开 http://localhost:5173/setup 设置管理员密码。

## 测试 / 构建 / 部署

```bash
pnpm test
pnpm build
pnpm deploy
```

部署前需要：

1. KV namespace（binding `KV`）
2. R2 bucket `edgemarks-backups`（binding `BACKUP`，可选但推荐）
3. Secret：`wrangler secret put JWT_SECRET`

## 导入格式

- Netscape / Chrome / Edge HTML 书签导出
- Chrome `Bookmarks` JSON
- 本站备份 JSON
- `{title,url}[]` 简易数组

导入按 URL 去重。
