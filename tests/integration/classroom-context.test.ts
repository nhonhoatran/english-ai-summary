import { describe, it, expect, beforeEach, vi } from "vitest";
import { getClassroomContext } from "@/lib/classroom/get-classroom-context";
import { db } from "@/lib/db";
import { resetTestDatabase } from "../helpers/reset-test-database";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/auth-cookie";
import { memberCookieName } from "@/lib/classroom/member-cookie";
import { env } from "@/lib/env";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (name: string) => {
        const value = cookieJar.get(name);
        return value === undefined ? undefined : { name, value };
      },
    })
  ),
}));

const CODE = "ABC123";

async function loginAs(user: { id: string; phone: string }) {
  cookieJar.set(
    AUTH_COOKIE_NAME,
    await signSession({ userId: user.id, phone: user.phone }, env.AUTH_SECRET)
  );
}

describe("getClassroomContext legacy membership cookie", () => {
  let host: { id: string; phone: string };
  let intruder: { id: string; phone: string };
  let classroomId: string;
  let legacyMemberId: string;

  beforeEach(async () => {
    cookieJar.clear();
    vi.clearAllMocks();
    await resetTestDatabase();

    host = await db.user.create({ data: { phone: "0900000001" } });
    intruder = await db.user.create({ data: { phone: "0900000002" } });

    const classroom = await db.classroom.create({
      data: { code: CODE, hostUserId: host.id, isActive: true },
    });
    classroomId = classroom.id;

    // Membership created before the userId column existed: the V4 backfill
    // matched on phone, so rows with a null phone were left unclaimed.
    const legacy = await db.classMember.create({
      data: { classroomId, userId: null, phone: null, displayName: "Host (0001)" },
    });
    legacyMemberId = legacy.id;

    cookieJar.set(memberCookieName(CODE), legacyMemberId);
  });

  it("adopts an unclaimed legacy membership for the logged in user", async () => {
    await loginAs(host);

    const ctx = await getClassroomContext(CODE);

    expect(ctx?.member?.id).toBe(legacyMemberId);
    expect(ctx?.member?.displayName).toBe("Host (0001)");

    const stored = await db.classMember.findUnique({ where: { id: legacyMemberId } });
    expect(stored?.userId).toBe(host.id);
  });

  it("does not hand a claimed membership to a second account in the same browser", async () => {
    await loginAs(host);
    await getClassroomContext(CODE); // host claims the row

    // Same browser, same classroom cookie, different phone signed in.
    await loginAs(intruder);
    const ctx = await getClassroomContext(CODE);

    expect(ctx?.userId).toBe(intruder.id);
    expect(ctx?.isHost).toBe(false);
    expect(ctx?.member).toBeNull();

    const stored = await db.classMember.findUnique({ where: { id: legacyMemberId } });
    expect(stored?.userId).toBe(host.id);
  });

  it("ignores a membership cookie pointing at another classroom", async () => {
    const other = await db.classroom.create({
      data: { code: "ZZZ999", hostUserId: host.id, isActive: true },
    });
    const otherMember = await db.classMember.create({
      data: { classroomId: other.id, userId: null, displayName: "Ai đó" },
    });

    cookieJar.set(memberCookieName(CODE), otherMember.id);
    await loginAs(intruder);

    const ctx = await getClassroomContext(CODE);
    expect(ctx?.member).toBeNull();
  });
});
