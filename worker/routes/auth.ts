import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Env } from "../env";
import { COOKIE_NAME, TOKEN_TTL_SEC } from "../env";
import { signJwt, verifyJwt } from "../jwt";
import { hashPassword, verifyPassword } from "../password";
import { getConfig, putConfig, toPublicSite } from "../store";

export type AppEnv = {
	Bindings: Env;
	Variables: { admin: boolean };
};

export const auth = new Hono<AppEnv>();

function cookieOpts(c: { req: { url: string } }) {
	const secure = new URL(c.req.url).protocol === "https:";
	return {
		httpOnly: true,
		sameSite: "Lax" as const,
		path: "/",
		maxAge: TOKEN_TTL_SEC,
		secure,
	};
}

export async function readAdmin(c: { req: { raw: Request; header: (n: string) => string | undefined }; env: Env }) {
	const header = c.req.header("authorization");
	const bearer = header?.startsWith("Bearer ") ? header.slice(7) : "";
	const cookie = getCookie(c as never, COOKIE_NAME) ?? "";
	const token = bearer || cookie;
	if (!token || !c.env.JWT_SECRET) return false;
	return Boolean(await verifyJwt(c.env.JWT_SECRET, token));
}

auth.get("/me", async (c) => {
	const admin = await readAdmin(c);
	const config = await getConfig(c.env);
	return c.json({ admin, site: toPublicSite(config) });
});

auth.post("/setup", async (c) => {
	const config = await getConfig(c.env);
	if (config.setupComplete) return c.json({ error: "already_setup" }, 400);
	const body = await c.req.json<{ password?: string; siteName?: string }>().catch(() => ({}));
	const password = body.password?.trim() ?? "";
	if (password.length < 8) return c.json({ error: "password_too_short" }, 400);
	if (!c.env.JWT_SECRET) return c.json({ error: "missing_jwt_secret" }, 500);
	config.passwordHash = await hashPassword(password, c.env.JWT_SECRET);
	config.setupComplete = true;
	if (body.siteName?.trim()) config.siteName = body.siteName.trim();
	config.updatedAt = Date.now();
	await putConfig(c.env, config);
	const token = await signJwt(c.env.JWT_SECRET, TOKEN_TTL_SEC);
	setCookie(c, COOKIE_NAME, token, cookieOpts(c));
	return c.json({ ok: true, token, site: toPublicSite(config) });
});

auth.post("/login", async (c) => {
	const config = await getConfig(c.env);
	if (!config.setupComplete) return c.json({ error: "not_setup" }, 400);
	const body = await c.req.json<{ password?: string }>().catch(() => ({}));
	const password = body.password ?? "";
	if (!(await verifyPassword(password, config.passwordHash, c.env.JWT_SECRET))) {
		return c.json({ error: "invalid_password" }, 401);
	}
	const token = await signJwt(c.env.JWT_SECRET, TOKEN_TTL_SEC);
	setCookie(c, COOKIE_NAME, token, cookieOpts(c));
	return c.json({ ok: true, token });
});

auth.post("/logout", (c) => {
	deleteCookie(c, COOKIE_NAME, { path: "/" });
	return c.json({ ok: true });
});
