import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "veloce_session";
export const CART_COOKIE_NAME = "veloce_cart_id";

/** 7 days in milliseconds — enforced on both the cookie Max-Age and server-side verification. */
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_CLOCK_SKEW_MS = 1000 * 60; // 1 minute

const DEV_FALLBACK_SECRET = "veloce-local-dev-secret-do-not-use-in-prod";

export interface SessionPayload {
  userId: string;
  iat: number;
}

/**
 * Resolves the HMAC signing secret lazily at request time.
 * In production, refuses to run with a hardcoded default secret.
 */
export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET environment variable must be set (minimum 16 characters) in production."
    );
  }

  return DEV_FALLBACK_SECRET;
}

function signPayload(encoded: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
}

export function createSessionToken(userId: string, now = Date.now()): string {
  const payload: SessionPayload = {
    userId,
    iat: now,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  now = Date.now()
): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = signPayload(encoded);
  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as Partial<SessionPayload>;

    if (typeof parsed.userId !== "string" || typeof parsed.iat !== "number") {
      return null;
    }

    // Reject expired tokens and tokens minted implausibly far in the future
    if (now - parsed.iat > SESSION_MAX_AGE_MS || parsed.iat > now + MAX_CLOCK_SKEW_MS) {
      return null;
    }

    return { userId: parsed.userId, iat: parsed.iat };
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token)?.userId ?? null;
}

export async function getOrCreateCartKey(): Promise<{
  cartKey: string;
  isNew: boolean;
  guestCartId: string | null;
}> {
  const userId = await getSessionUserId();
  if (userId) {
    return { cartKey: `user:${userId}`, isNew: false, guestCartId: null };
  }

  const cookieStore = await cookies();
  const existingGuestId = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (existingGuestId && /^[a-zA-Z0-9_-]{8,64}$/.test(existingGuestId)) {
    return {
      cartKey: `guest:${existingGuestId}`,
      isNew: false,
      guestCartId: existingGuestId,
    };
  }

  const newGuestId = crypto.randomBytes(12).toString("base64url");
  return {
    cartKey: `guest:${newGuestId}`,
    isNew: true,
    guestCartId: newGuestId,
  };
}
