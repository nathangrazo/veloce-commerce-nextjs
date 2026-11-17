import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as sessionModule from "@/server/session";
import * as storeModule from "@/server/store";

const validShippingAddress = {
  recipientName: "Alex Morgan",
  email: "demo@veloce.store",
  phone: "+1 (415) 890-4421",
  street: "742 Evergreen Terrace, Suite 4B",
  city: "San Francisco",
  state: "CA",
  zipCode: "94107",
  country: "United States",
};

function makeOrderRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    vi.spyOn(sessionModule, "getSessionUserId").mockResolvedValue(null);

    const response = await POST(
      makeOrderRequest({
        paymentMethod: "credit_card",
        shippingAddress: validShippingAddress,
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when cart is empty", async () => {
    vi.spyOn(sessionModule, "getSessionUserId").mockResolvedValue("usr_demo_01");
    vi.spyOn(sessionModule, "getOrCreateCartKey").mockResolvedValue({
      cartKey: "user:usr_demo_01",
      isNew: false,
      guestCartId: null,
    });
    vi.spyOn(storeModule, "getCart").mockResolvedValue([]);

    const response = await POST(
      makeOrderRequest({
        paymentMethod: "pix",
        shippingAddress: validShippingAddress,
      })
    );

    expect(response.status).toBe(400);
  });

  it("recalculates totals server-side with WELCOME10 coupon, saves order, and clears cart", async () => {
    vi.spyOn(sessionModule, "getSessionUserId").mockResolvedValue("usr_demo_01");
    vi.spyOn(sessionModule, "getOrCreateCartKey").mockResolvedValue({
      cartKey: "user:usr_demo_01",
      isNew: false,
      guestCartId: null,
    });
    // Aero Knit Runner = $145.00 (14500 cents)
    vi.spyOn(storeModule, "getCart").mockResolvedValue([
      { productId: "prod_aero_runner", quantity: 1, addedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const saveOrderSpy = vi
      .spyOn(storeModule, "saveOrder")
      .mockImplementation(async (order) => order);
    const saveCartSpy = vi
      .spyOn(storeModule, "saveCart")
      .mockImplementation(async (_k, items) => items);

    const response = await POST(
      makeOrderRequest({
        paymentMethod: "credit_card",
        shippingAddress: validShippingAddress,
        couponCode: "WELCOME10",
      })
    );

    expect(response.status).toBe(201);
    const json = (await response.json()) as {
      order: {
        id: string;
        pricing: {
          subtotalCents: number;
          discountCents: number;
          shippingCents: number;
          totalCents: number;
          couponCode: string | null;
        };
      };
    };

    // 14500 - 10% (1450) = 13050 + 1800 shipping = 14850
    expect(json.order.id).toMatch(/^VLC-[A-F0-9]{6}$/);
    expect(json.order.pricing).toEqual({
      subtotalCents: 14500,
      discountCents: 1450,
      shippingCents: 1800,
      totalCents: 14850,
      couponCode: "WELCOME10",
    });
    expect(saveOrderSpy).toHaveBeenCalledTimes(1);
    expect(saveCartSpy).toHaveBeenCalledWith("user:usr_demo_01", []);
  });
});
