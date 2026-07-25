import { describe, it, expect, vi } from "vitest";
import { requireAuth } from "@/lib/auth/require-auth";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/auth-cookie";
import { env } from "@/lib/env";

const mockGetCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockGetCookie,
  })),
}));

describe("auth-guard (requireAuth)", () => {
  it("throws Unauthorized error when auth cookie is missing", async () => {
    mockGetCookie.mockReturnValue(undefined);

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("throws Unauthorized error when auth cookie is forged or invalid", async () => {
    mockGetCookie.mockReturnValue({ name: AUTH_COOKIE_NAME, value: "forged.cookie.value" });

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("passes without throwing when auth cookie is valid and signed", async () => {
    const validToken = await signSession(env.AUTH_SECRET);
    mockGetCookie.mockReturnValue({ name: AUTH_COOKIE_NAME, value: validToken });

    await expect(requireAuth()).resolves.toBeUndefined();
  });
});
