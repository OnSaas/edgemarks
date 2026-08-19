import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../worker/password";

describe("password", () => {
	it("hashes and verifies with pepper", async () => {
		const hash = await hashPassword("correct-horse", "pepper-secret");
		expect(hash.startsWith("hmac$1$")).toBe(true);
		expect(await verifyPassword("correct-horse", hash, "pepper-secret")).toBe(true);
		expect(await verifyPassword("wrong", hash, "pepper-secret")).toBe(false);
		expect(await verifyPassword("correct-horse", hash, "other-pepper")).toBe(false);
	});
});
