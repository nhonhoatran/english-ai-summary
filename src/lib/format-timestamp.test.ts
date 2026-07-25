import { describe, it, expect } from "vitest";
import { formatTimestamp } from "./format-timestamp";

describe("formatTimestamp", () => {
  it("formats 0 seconds as 0:00", () => {
    expect(formatTimestamp(0)).toBe("0:00");
  });

  it("formats single digit seconds with leading zero", () => {
    expect(formatTimestamp(5)).toBe("0:05");
  });

  it("formats 59 seconds as 0:59", () => {
    expect(formatTimestamp(59)).toBe("0:59");
  });

  it("formats 60 seconds as 1:00", () => {
    expect(formatTimestamp(60)).toBe("1:00");
  });

  it("formats 61 seconds as 1:01", () => {
    expect(formatTimestamp(61)).toBe("1:01");
  });

  it("formats 599 seconds as 9:59", () => {
    expect(formatTimestamp(599)).toBe("9:59");
  });

  it("formats 3600 seconds as 1:00:00", () => {
    expect(formatTimestamp(3600)).toBe("1:00:00");
  });

  it("formats 3661 seconds as 1:01:01", () => {
    expect(formatTimestamp(3661)).toBe("1:01:01");
  });

  it("handles negative numbers or NaN gracefully", () => {
    expect(formatTimestamp(-10)).toBe("0:00");
    expect(formatTimestamp(NaN)).toBe("0:00");
  });
});
