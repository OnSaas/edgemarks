import { describe, expect, it } from "vitest";
import { mergeFeatures } from "../shared/types";

describe("site features", () => {
	it("fills missing flags with defaults", () => {
		expect(mergeFeatures(undefined).showLoginButton).toBe(true);
		expect(mergeFeatures({ showLoginButton: false }).showLoginButton).toBe(false);
		expect(mergeFeatures({ showLoginButton: false }).showSearch).toBe(true);
	});
});
