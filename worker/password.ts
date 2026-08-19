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

async function hmac(secret: string, data: Uint8Array): Promise<ArrayBuffer> {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return crypto.subtle.sign("HMAC", key, data as BufferSource);
}

/** Workers Free is 10ms CPU — PBKDF2 210k overflows. HMAC + high-entropy pepper fits. */
export async function hashPassword(password: string, pepper: string): Promise<string> {
	if (!pepper) throw new Error("missing_pepper");
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const payload = new Uint8Array(salt.length + encoder.encode(password).length);
	payload.set(salt, 0);
	payload.set(encoder.encode(password), salt.length);
	const bits = await hmac(pepper, payload);
	return `hmac$1$${toB64(salt)}$${toB64(bits)}`;
}

export async function verifyPassword(password: string, stored: string, pepper: string): Promise<boolean> {
	const parts = stored.split("$");
	if (parts.length !== 4 || parts[0] !== "hmac" || parts[1] !== "1" || !pepper) return false;
	const salt = fromB64(parts[2]);
	const expected = fromB64(parts[3]);
	const payload = new Uint8Array(salt.length + encoder.encode(password).length);
	payload.set(salt, 0);
	payload.set(encoder.encode(password), salt.length);
	const actual = new Uint8Array(await hmac(pepper, payload));
	if (actual.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
	return diff === 0;
}
