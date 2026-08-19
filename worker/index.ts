import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { adminApi } from "./routes/admin";
import { auth, type AppEnv } from "./routes/auth";
import { publicApi } from "./routes/public";

const app = new Hono<AppEnv>();

app.onError((err, c) => {
	console.error(err);
	return c.json({ error: "internal_error", message: err.message }, 500);
});

app.use(
	"/api/*",
	cors({
		origin: (origin) => origin || "*",
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
);

app.get("/api/health", (c) => c.json({ ok: true, name: "edgemarks" }));
app.route("/api/auth", auth);
app.route("/api/public", publicApi);
app.route("/api/admin", adminApi);

app.notFound((c) => {
	if (new URL(c.req.url).pathname.startsWith("/api/")) {
		return c.json({ error: "not_found" }, 404);
	}
	return c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.text("Not found", 404);
});

export default {
	fetch: (request: Request, env: Env, ctx: ExecutionContext) => app.fetch(request, env, ctx),
};
