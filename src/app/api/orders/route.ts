import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { calculatePricing } from "@/domain/pricing";
import { createOrderSchema } from "@/domain/schemas";
import type { HydratedCartItem, Order, OrderLineItem } from "@/domain/types";
import { getProductById } from "@/server/data/products";
import { getOrCreateCartKey, getSessionUserId } from "@/server/session";
import { getCart, listOrdersByUser, saveCart, saveOrder } from "@/server/store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const orders = await listOrdersByUser(userId);
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in before placing an order." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please review your shipping details.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { cartKey } = await getOrCreateCartKey();
  const cartItems = await getCart(cartKey);

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is currently empty." }, { status: 400 });
  }

  // Server-side catalog hydration & authoritative price calculation (never trusts client totals)
  const hydratedItems: HydratedCartItem[] = [];
  const lineItems: OrderLineItem[] = [];

  for (const item of cartItems) {
    const product = getProductById(item.productId);
    if (!product) continue;

    const safeQty = Math.max(1, Math.min(product.stock, item.quantity));
    const lineTotalCents = product.priceCents * safeQty;

    hydratedItems.push({
      product,
      quantity: safeQty,
      lineTotalCents,
    });

    lineItems.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.image,
      unitPriceCents: product.priceCents,
      quantity: safeQty,
      lineTotalCents,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "No valid products remain in your cart." },
      { status: 400 }
    );
  }

  const pricing = calculatePricing(hydratedItems, parsed.data.couponCode);

  const order: Order = {
    id: `VLC-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    userId,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    paymentMethod: parsed.data.paymentMethod,
    shippingAddress: parsed.data.shippingAddress,
    items: lineItems,
    pricing: {
      subtotalCents: pricing.subtotalCents,
      discountCents: pricing.discountCents,
      shippingCents: pricing.shippingCents,
      totalCents: pricing.totalCents,
      couponCode: pricing.appliedCoupon?.code ?? null,
    },
  };

  await saveOrder(order);
  await saveCart(cartKey, []);

  return NextResponse.json({ order }, { status: 201 });
}
