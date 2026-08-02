import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getTodayPointsSummary } from "@/lib/points/get-today-points-summary";
import { handleRouteError } from "@/lib/api/handle-route-error";

export async function GET() {
  try {
    const session = await requireAuth();
    return NextResponse.json(await getTodayPointsSummary(session.userId));
  } catch (error: unknown) {
    return handleRouteError("GET /api/points/today", error);
  }
}
