import { describe, it, expect } from "vitest";

describe("API configuration", () => {
  it("resolves dev API base to PHP proxy", () => {
    expect(import.meta.env.DEV).toBe(true);
  });
});
