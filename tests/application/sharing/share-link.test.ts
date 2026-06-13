import { describe, it, expect } from "vitest";
import {
  buildShareHash,
  parseShareHash,
} from "../../../src/application/sharing/share-link";

describe("share-link", () => {
  it("builds and parses round-trip", () => {
    const hash = buildShareHash("fam-123", "tok_ABC");
    expect(hash).toBe("#/share/fam-123?t=tok_ABC");
    expect(parseShareHash(hash)).toEqual({
      familyId: "fam-123",
      token: "tok_ABC",
    });
  });

  it("encodes special characters", () => {
    const hash = buildShareHash("a/b", "x y");
    expect(parseShareHash(hash)).toEqual({ familyId: "a/b", token: "x y" });
  });

  it("returns null for non-share hashes", () => {
    expect(parseShareHash("")).toBeNull();
    expect(parseShareHash("#/family/abc")).toBeNull();
    expect(parseShareHash("#/share/abc")).toBeNull(); // missing token
  });
});
