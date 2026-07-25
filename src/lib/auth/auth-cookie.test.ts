import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./auth-cookie";

describe("auth-cookie session signing and verification", () => {
  const validSecret = "a_super_secret_test_key_that_is_at_least_32_characters_long";
  const wrongSecret = "another_different_secret_key_that_is_also_32_characters_long";

  it("verifies a freshly signed session token", async () => {
    const token = await signSession(validSecret);
    expect(token).toBeDefined();
    expect(token.includes(".")).toBe(true);

    const isValid = await verifySession(token, validSecret);
    expect(isValid).toBe(true);
  });

  it("rejects token signed with a different secret key", async () => {
    const token = await signSession(validSecret);
    const isValid = await verifySession(token, wrongSecret);
    expect(isValid).toBe(false);
  });

  it("rejects a tampered payload timestamp", async () => {
    const token = await signSession(validSecret);
    const [issuedAtStr, sig] = token.split(".");
    const tamperedIssuedAt = (parseInt(issuedAtStr, 10) - 1000).toString();
    const tamperedToken = `${tamperedIssuedAt}.${sig}`;

    const isValid = await verifySession(tamperedToken, validSecret);
    expect(isValid).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await signSession(validSecret);
    const [issuedAtStr, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -2) + "xx";
    const tamperedToken = `${issuedAtStr}.${tamperedSig}`;

    const isValid = await verifySession(tamperedToken, validSecret);
    expect(isValid).toBe(false);
  });

  it("rejects garbage strings and malformed formats", async () => {
    expect(await verifySession("not_a_valid_token", validSecret)).toBe(false);
    expect(await verifySession("part1.part2.part3", validSecret)).toBe(false);
    expect(await verifySession("abc.", validSecret)).toBe(false);
    expect(await verifySession(".abc", validSecret)).toBe(false);
  });

  it("rejects empty or null input", async () => {
    expect(await verifySession("", validSecret)).toBe(false);
    expect(await verifySession(null, validSecret)).toBe(false);
    expect(await verifySession(undefined, validSecret)).toBe(false);
  });
});
