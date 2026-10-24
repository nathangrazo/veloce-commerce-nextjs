import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "veloce_session";
export const CART_COOKIE_NAME = "veloce_cart_id";

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "veloce-commerce-dev-secret-change-in-production";

interface SessionPayload {
  userId: string;
  iat: number;
}

function signPayload(encoded: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    userId,
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
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
    if (typeof parsed.userId === "string" && typeof parsed.iat === "number") {
      return { userId: parsed.userId, iat: parsed.iat };
    }
    return null;
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
