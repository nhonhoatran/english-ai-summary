import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./auth-cookie";

describe("auth-cookie session signing and verification", () => {
  const validSecret = "a_super_secret_test_key_that_is_at_least_32_characters_long";
  const wrongSecret = "another_different_secret_key_that_is_also_32_characters_long";
  const userPayload = { userId: "user-123", phone: "0912345678" };

  it("verifies a freshly signed session token and returns user details", async () => {
    const token = await signSession(userPayload, validSecret);
    expect(token).toBeDefined();
    expect(token.includes(".")).toBe(true);

    const session = await verifySession(token, validSecret);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-123");
    expect(session?.phone).toBe("0912345678");
  });

  it("rejects token signed with a different secret key", async () => {
    const token = await signSession(userPayload, validSecret);
    const session = await verifySession(token, wrongSecret);
    expect(session).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession(userPayload, validSecret);
    const [payloadBase64, sig] = token.split(".");
    const tamperedToken = `${payloadBase64}extra.${sig}`;

    const session = await verifySession(tamperedToken, validSecret);
    expect(session).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const token = await signSession(userPayload, validSecret);
    const [payloadBase64, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -2) + "xx";
    const tamperedToken = `${payloadBase64}.${tamperedSig}`;

    const session = await verifySession(tamperedToken, validSecret);
    expect(session).toBeNull();
  });

  it("rejects garbage strings and malformed formats", async () => {
    expect(await verifySession("not_a_valid_token", validSecret)).toBeNull();
    expect(await verifySession("part1.part2.part3", validSecret)).toBeNull();
    expect(await verifySession("abc.", validSecret)).toBeNull();
    expect(await verifySession(".abc", validSecret)).toBeNull();
  });

  it("rejects empty or null input", async () => {
    expect(await verifySession("", validSecret)).toBeNull();
    expect(await verifySession(null, validSecret)).toBeNull();
    expect(await verifySession(undefined, validSecret)).toBeNull();
  });
});
