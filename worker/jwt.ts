const encoder = new TextEncoder();

function bytesToB64url(bytes: ArrayBuffer | Uint8Array): string {
	const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let bin = "";
	for (const b of arr) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBytes(input: string): Uint8Array {
	const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
	const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

export type JwtPayload = {
	sub: "admin";
	iat: number;
	exp: number;
};

export async function signJwt(secret: string, ttlSec: number): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = bytesToB64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
	const payload: JwtPayload = { sub: "admin", iat: now, exp: now + ttlSec };
	const body = bytesToB64url(encoder.encode(JSON.stringify(payload)));
	const data = `${header}.${body}`;
	const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(data));
	return `${data}.${bytesToB64url(sig)}`;
}

export async function verifyJwt(secret: string, token: string): Promise<JwtPayload | null> {
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	const [header, body, sig] = parts;
	const data = `${header}.${body}`;
	const ok = await crypto.subtle.verify(
		"HMAC",
		await hmacKey(secret),
		b64urlToBytes(sig) as BufferSource,
		encoder.encode(data),
	);
	if (!ok) return null;
	try {
		const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as JwtPayload;
		if (payload.sub !== "admin") return null;
		if (payload.exp < Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}
