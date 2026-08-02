/**
 * The per-classroom membership cookie. It was previously built inline in five
 * different places with a 1-day lifetime, which silently kicked students out of
 * a class they had already joined the day before.
 */

export const CLASSROOM_MEMBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Shared prefix so logout can expire every classroom cookie in one sweep. */
export const CLASSROOM_MEMBER_COOKIE_PREFIX = "classroom_member_id_";

export function memberCookieName(code: string): string {
  return `${CLASSROOM_MEMBER_COOKIE_PREFIX}${code.toUpperCase()}`;
}

/** True for any per-classroom membership cookie, whatever the class code. */
export function isMemberCookieName(name: string): boolean {
  return name.startsWith(CLASSROOM_MEMBER_COOKIE_PREFIX);
}
