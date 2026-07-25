// path/to/src/lib/auth/auth-cookie.ts

export const AUTH_COOKIE_NAME = "auth_session";
export const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface UserSession {
  userId: string;
  phone: string;
  issuedAt: number;
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(
  userPayload: { userId: string; phone: string },
  secret: string
): Promise<string> {
  const issuedAt = Date.now();
  const session: UserSession = {
    userId: userPayload.userId,
    phone: userPayload.phone,
    issuedAt,
  };
  const jsonStr = JSON.stringify(session);
  const enc = new TextEncoder();
  const payloadBase64Url = bufferToBase64Url(enc.encode(jsonStr).buffer);

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(payloadBase64Url)
  );
  const sigBase64Url = bufferToBase64Url(signature);
  return `${payloadBase64Url}.${sigBase64Url}`;
}

export async function verifySession(
  token: string | undefined | null,
  secret: string
): Promise<UserSession | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64Url, sigBase64Url] = parts;
  if (!payloadBase64Url || !sigBase64Url) return null;

  try {
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const sigBytes = base64UrlToBuffer(sigBase64Url);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadBase64Url)
    );
    if (!valid) return null;

    const payloadBytes = base64UrlToBuffer(payloadBase64Url);
    const dec = new TextDecoder();
    const jsonStr = dec.decode(payloadBytes);
    const session: UserSession = JSON.parse(jsonStr);

    if (!session || !session.userId || !session.phone || typeof session.issuedAt !== "number") {
      return null;
    }

    // Expiration check (30 days)
    const maxAgeMs = COOKIE_MAX_AGE_SECONDS * 1000;
    if (Date.now() - session.issuedAt > maxAgeMs) return null;

    return session;
  } catch {
    return null;
  }
}
