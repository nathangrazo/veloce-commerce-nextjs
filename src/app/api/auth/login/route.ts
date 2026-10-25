import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/domain/schemas";
import type { CartItem } from "@/domain/types";
import { getProductById } from "@/server/data/products";
import { CART_COOKIE_NAME, createSessionToken, SESSION_COOKIE_NAME } from "@/server/session";
import { authenticateDemoUser, getCart, saveCart } from "@/server/store";

function mergeCarts(primary: CartItem[], guest: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of primary) {
    merged.set(item.productId, { ...item });
  }
  for (const item of guest) {
    const product = getProductById(item.productId);
    const maxStock = product?.stock ?? 20;
    const existing = merged.get(item.productId);
    if (existing) {
      merged.set(item.productId, {
        ...existing,
        quantity: Math.min(maxStock, existing.quantity + item.quantity),
      });
    } else {
      merged.set(item.productId, { ...item, quantity: Math.min(maxStock, item.quantity) });
    }
  }
  return Array.from(merged.values());
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid credentials." },
      { status: 400 }
    );
  }

  const user = await authenticateDemoUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password. Try the demo credentials below." },
      { status: 401 }
    );
  }

  // Seamless guest-to-authenticated cart merge on sign-in
  const cookieStore = await cookies();
  const guestCartId = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (guestCartId) {
    const guestKey = `guest:${guestCartId}`;
    const userKey = `user:${user.id}`;
    const [guestCart, userCart] = await Promise.all([getCart(guestKey), getCart(userKey)]);
    if (guestCart.length > 0) {
      await saveCart(userKey, mergeCarts(userCart, guestCart));
      await saveCart(guestKey, []);
    }
  }

  const token = createSessionToken(user.id);
  const response = NextResponse.json({ user });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
