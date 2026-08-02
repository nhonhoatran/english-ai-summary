import { describe, it, expect } from "vitest";
import {
  buildHostDisplayName,
  sanitizeDisplayName,
  initialOf,
} from "./display-name";

describe("buildHostDisplayName", () => {
  it("uses the last four phone digits", () => {
    expect(buildHostDisplayName("0912345678")).toBe("Host (5678)");
  });

  it("falls back to a plain label without a phone", () => {
    expect(buildHostDisplayName(null)).toBe("Host");
    expect(buildHostDisplayName(undefined)).toBe("Host");
  });
});

describe("sanitizeDisplayName", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeDisplayName("  Hoa  ")).toBe("Hoa");
  });

  it("strips HTML tags", () => {
    expect(sanitizeDisplayName("<b>Hoa</b>")).toBe("Hoa");
  });

  it("rejects names that are empty after cleaning", () => {
    expect(sanitizeDisplayName("   ")).toBeNull();
    expect(sanitizeDisplayName("<br/>")).toBeNull();
  });

  it("rejects names longer than 30 characters", () => {
    expect(sanitizeDisplayName("a".repeat(31))).toBeNull();
    expect(sanitizeDisplayName("a".repeat(30))).toBe("a".repeat(30));
  });

  it("rejects non-string input", () => {
    expect(sanitizeDisplayName(42)).toBeNull();
    expect(sanitizeDisplayName(undefined)).toBeNull();
  });
});

describe("initialOf", () => {
  it("upper-cases the first character", () => {
    expect(initialOf("hoa")).toBe("H");
  });

  it("ignores leading whitespace", () => {
    expect(initialOf("  nam")).toBe("N");
  });

  it("falls back to ? for an empty name", () => {
    expect(initialOf("")).toBe("?");
  });
});
