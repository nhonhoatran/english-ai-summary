/**
 * Display-name helpers for classrooms.
 *
 * Host detection used to be a `displayName.startsWith("Host")` string sniff,
 * which broke as soon as a student named themselves "Hostel". Membership now
 * carries a userId, so callers compare that against Classroom.hostUserId and
 * only use these helpers to render a label.
 */

/** Label shown for the classroom host, derived from the last 4 phone digits. */
export function buildHostDisplayName(phone?: string | null): string {
  return phone ? `Host (${phone.slice(-4)})` : "Host";
}

/** Strip tags and clamp a student-supplied name. Returns null when unusable. */
export function sanitizeDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/<[^>]*>?/gm, "").trim();
  if (cleaned.length === 0 || cleaned.length > 30) return null;
  return cleaned;
}

/** Two-letter-ish initial used by member avatars. */
export function initialOf(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || "?";
}
