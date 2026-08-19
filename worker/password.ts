const ITERATIONS = 210_000;
const encoder = new TextEncoder();

function toB64(bytes: ArrayBuffer | Uint8Array): string {
	const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let bin = "";
	for (const b of arr) bin += String.fromCharCode(b);
	return btoa(bin);
}

function fromB64(input: string): Uint8Array {
	const bin = atob(input);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
	const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
	return crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
		key,
		256,
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const bits = await derive(password, salt, ITERATIONS);
	return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split("$");
	if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
	const iterations = Number(parts[1]);
	if (!Number.isFinite(iterations) || iterations < 10_000) return false;
	const salt = fromB64(parts[2]);
	const expected = fromB64(parts[3]);
	const actual = new Uint8Array(await derive(password, salt, iterations));
	if (actual.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
	return diff === 0;
}
