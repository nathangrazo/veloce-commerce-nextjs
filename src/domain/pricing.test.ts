import { describe, expect, it } from "vitest";
import {
  calculatePricing,
  FREE_SHIPPING_THRESHOLD_CENTS,
  resolveCoupon,
  STANDARD_SHIPPING_CENTS,
} from "./pricing";
import type { HydratedCartItem, Product } from "./types";

const mockSneakers: Product = {
  id: "prod_1",
  slug: "sneakers",
  name: "Aero Knit Runner",
  subtitle: "Sneakers",
  description: "Test",
  priceCents: 10000,
  category: "Apparel",
  image: "/images/products/sneakers.jpg",
  rating: 4.8,
  reviewCount: 50,
  stock: 10,
  specs: [],
};

const mockDesk: Product = {
  id: "prod_2",
  slug: "desk",
  name: "Studio Desk",
  subtitle: "Desk",
  description: "Test",
  priceCents: 30000,
  category: "Furniture",
  image: "/images/products/desk.jpg",
  rating: 4.9,
  reviewCount: 40,
  stock: 5,
  specs: [],
};

describe("pricing domain engine", () => {
  it("returns zeroed totals for an empty cart", () => {
    const result = calculatePricing([]);
    expect(result.itemCount).toBe(0);
    expect(result.subtotalCents).toBe(0);
    expect(result.shippingCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.remainingForFreeShippingCents).toBe(0);
  });

  it("charges standard shipping below the free shipping threshold", () => {
    const items: HydratedCartItem[] = [
      { product: mockSneakers, quantity: 1, lineTotalCents: 10000 },
    ];
    const result = calculatePricing(items);

    expect(result.subtotalCents).toBe(10000);
    expect(result.shippingCents).toBe(STANDARD_SHIPPING_CENTS);
    expect(result.totalCents).toBe(10000 + STANDARD_SHIPPING_CENTS);
    expect(result.remainingForFreeShippingCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS - 10000);
  });

  it("unlocks free shipping when subtotal meets or exceeds threshold", () => {
    const items: HydratedCartItem[] = [
      { product: mockDesk, quantity: 1, lineTotalCents: 30000 },
    ];
    const result = calculatePricing(items);

    expect(result.shippingCents).toBe(0);
    expect(result.remainingForFreeShippingCents).toBe(0);
    expect(result.totalCents).toBe(30000);
  });

  it("applies WELCOME10 percentage discount accurately", () => {
    const items: HydratedCartItem[] = [
      { product: mockDesk, quantity: 1, lineTotalCents: 30000 },
    ];
    const result = calculatePricing(items, "welcome10");

    expect(result.appliedCoupon?.code).toBe("WELCOME10");
    expect(result.discountCents).toBe(3000);
    expect(result.shippingCents).toBe(0); // 27000 >= 25000
    expect(result.totalCents).toBe(27000);
  });

  it("applies FREESHIP coupon even below threshold", () => {
    const items: HydratedCartItem[] = [
      { product: mockSneakers, quantity: 1, lineTotalCents: 10000 },
    ];
    const result = calculatePricing(items, "FREESHIP");

    expect(result.appliedCoupon?.code).toBe("FREESHIP");
    expect(result.discountCents).toBe(0);
    expect(result.shippingCents).toBe(0);
    expect(result.totalCents).toBe(10000);
  });

  it("ignores unknown coupon codes safely", () => {
    expect(resolveCoupon("BOGUS")).toBeNull();
    expect(resolveCoupon("")).toBeNull();
  });
});
