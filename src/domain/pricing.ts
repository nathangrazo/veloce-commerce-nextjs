import type { Coupon, CouponCode, HydratedCartItem, PricingBreakdown } from "./types";

export const FREE_SHIPPING_THRESHOLD_CENTS = 25000; // $250.00
export const STANDARD_SHIPPING_CENTS = 1800; // $18.00

export const AVAILABLE_COUPONS: Record<CouponCode, Coupon> = {
  WELCOME10: {
    code: "WELCOME10",
    description: "10% off your entire order",
    discountPercent: 10,
  },
  FREESHIP: {
    code: "FREESHIP",
    description: "Complimentary express shipping",
    freeShipping: true,
  },
};

export function resolveCoupon(code: string | null | undefined): Coupon | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized in AVAILABLE_COUPONS) {
    return AVAILABLE_COUPONS[normalized as CouponCode];
  }
  return null;
}

/**
 * Pure domain pricing calculator used identically on both client previews
 * and server-side order verification to guarantee zero pricing drift.
 */
export function calculatePricing(
  items: HydratedCartItem[],
  couponCode?: string | null
): PricingBreakdown {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );

  const appliedCoupon = resolveCoupon(couponCode);

  const discountCents =
    appliedCoupon?.discountPercent && subtotalCents > 0
      ? Math.round((subtotalCents * appliedCoupon.discountPercent) / 100)
      : 0;

  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);

  const qualifiesForFreeShipping =
    itemCount === 0 ||
    discountedSubtotal >= FREE_SHIPPING_THRESHOLD_CENTS ||
    Boolean(appliedCoupon?.freeShipping);

  const shippingCents = qualifiesForFreeShipping ? 0 : STANDARD_SHIPPING_CENTS;
  const totalCents = discountedSubtotal + shippingCents;

  const remainingForFreeShippingCents = qualifiesForFreeShipping
    ? 0
    : Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - discountedSubtotal);

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    itemCount,
    freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
    remainingForFreeShippingCents,
    appliedCoupon,
  };
}
