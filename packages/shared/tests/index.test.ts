import { describe, it, expect } from "vitest";
import { APPROVAL } from "../src/index";

describe("Shared Constants", () => {
  it("should have correct approval strings", () => {
    expect(APPROVAL.YES).toBe("Yes, confirmed.");
    expect(APPROVAL.NO).toBe("No, denied.");
  });
});
