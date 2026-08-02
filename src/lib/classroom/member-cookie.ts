/**
 * The per-classroom membership cookie. It was previously built inline in five
 * different places with a 1-day lifetime, which silently kicked students out of
 * a class they had already joined the day before.
 */

export const CLASSROOM_MEMBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function memberCookieName(code: string): string {
  return `classroom_member_id_${code.toUpperCase()}`;
}
