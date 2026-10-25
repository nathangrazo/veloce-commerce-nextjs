import { NextRequest, NextResponse } from "next/server";
import { cartMutationSchema, cartUpdateSchema } from "@/domain/schemas";
import type { CartItem } from "@/domain/types";
import { getProductById } from "@/server/data/products";
import { CART_COOKIE_NAME, getOrCreateCartKey } from "@/server/session";
import { getCart, saveCart } from "@/server/store";

function attachGuestCartCookie(
  response: NextResponse,
  isNew: boolean,
  guestCartId: string | null
) {
  if (isNew && guestCartId) {
    response.cookies.set(CART_COOKIE_NAME, guestCartId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export async function GET() {
  const { cartKey, isNew, guestCartId } = await getOrCreateCartKey();
  const items = await getCart(cartKey);
  return attachGuestCartCookie(NextResponse.json({ items }), isNew, guestCartId);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = cartMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid cart item." },
      { status: 400 }
    );
  }

  const product = getProductById(parsed.data.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { cartKey, isNew, guestCartId } = await getOrCreateCartKey();
  const current = await getCart(cartKey);
  const existingIndex = current.findIndex((item) => item.productId === product.id);

  let updated: CartItem[];
  if (existingIndex >= 0) {
    updated = current.map((item, idx) =>
      idx === existingIndex
        ? {
            ...item,
            quantity: Math.min(product.stock, item.quantity + parsed.data.quantity),
          }
        : item
    );
  } else {
    updated = [
      ...current,
      {
        productId: product.id,
        quantity: Math.min(product.stock, parsed.data.quantity),
        addedAt: new Date().toISOString(),
      },
    ];
  }

  await saveCart(cartKey, updated);
  return attachGuestCartCookie(NextResponse.json({ items: updated }), isNew, guestCartId);
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = cartUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update payload." },
      { status: 400 }
    );
  }

  const product = getProductById(parsed.data.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { cartKey, isNew, guestCartId } = await getOrCreateCartKey();
  const current = await getCart(cartKey);

  const updated =
    parsed.data.quantity <= 0
      ? current.filter((item) => item.productId !== product.id)
      : current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(product.stock, parsed.data.quantity) }
            : item
        );

  await saveCart(cartKey, updated);
  return attachGuestCartCookie(NextResponse.json({ items: updated }), isNew, guestCartId);
}

export async function DELETE(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  const { cartKey, isNew, guestCartId } = await getOrCreateCartKey();

  if (!productId) {
    await saveCart(cartKey, []);
    return attachGuestCartCookie(NextResponse.json({ items: [] }), isNew, guestCartId);
  }

  const current = await getCart(cartKey);
  const updated = current.filter((item) => item.productId !== productId);
  await saveCart(cartKey, updated);
  return attachGuestCartCookie(NextResponse.json({ items: updated }), isNew, guestCartId);
}
