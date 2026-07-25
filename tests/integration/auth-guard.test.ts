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

  it("returns user session when auth cookie is valid and signed", async () => {
    const validToken = await signSession(
      { userId: "test-user-id", phone: "0900000000" },
      env.AUTH_SECRET
    );
    mockGetCookie.mockReturnValue({ name: AUTH_COOKIE_NAME, value: validToken });

    const session = await requireAuth();
    expect(session.userId).toBe("test-user-id");
    expect(session.phone).toBe("0900000000");
  });
});
