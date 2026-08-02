import { NextResponse } from "next/server";

/** Message thrown by `requireAuth()` when there is no valid session. */
export const UNAUTHORIZED_MESSAGE = "Unauthorized";

/**
 * `requireAuth()` signals a missing session by throwing a plain Error. Route
 * handlers used to detect it with `error?.message === "Unauthorized"` on an
 * `any`-typed catch binding, which is both untyped and easy to get subtly wrong.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === UNAUTHORIZED_MESSAGE;
}

/**
 * Shared terminal catch for route handlers.
 *
 * Turns a thrown auth error into 401 and anything else into a logged 500 with a
 * generic body — internal error text never reaches the client. `context` is the
 * route label used in the server log, e.g. "POST /api/cat/feed".
 */
export function handleRouteError(context: string, error: unknown): NextResponse {
  if (isUnauthorizedError(error)) {
    return NextResponse.json({ error: UNAUTHORIZED_MESSAGE }, { status: 401 });
  }

  console.error(`Error in ${context}:`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
