import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import {
  CartProvider,
  cartReducer,
  INITIAL_CART_STATE,
  useCartActions,
  useCartState,
} from "./CartContext";
import { ToastProvider } from "./ToastContext";
import type { Product } from "@/domain/types";
import { authService } from "@/services/auth.service";
import { cartService } from "@/services/cart.service";

const sampleProduct: Product = {
  id: "prod_aero_runner",
  slug: "aero-knit-runner",
  name: "Aero Knit Runner",
  subtitle: "Athletic knit",
  description: "Test shoe",
  priceCents: 14500,
  category: "Apparel",
  image: "/images/products/sneakers.jpg",
  rating: 4.9,
  reviewCount: 100,
  stock: 3,
  specs: [],
};

describe("cartReducer", () => {
  it("optimistically adds a new item and clamps quantity to available stock", () => {
    const added = cartReducer(INITIAL_CART_STATE, {
      type: "OPTIMISTIC_ADD",
      productId: sampleProduct.id,
      quantity: 2,
      maxStock: sampleProduct.stock,
    });
    expect(added.items).toHaveLength(1);
    expect(added.items[0]?.quantity).toBe(2);
    expect(added.isSyncing).toBe(true);

    const clamped = cartReducer(added, {
      type: "OPTIMISTIC_ADD",
      productId: sampleProduct.id,
      quantity: 5,
      maxStock: sampleProduct.stock,
    });
    expect(clamped.items[0]?.quantity).toBe(3);
  });

  it("removes an item when quantity is updated to zero", () => {
    const seeded = cartReducer(INITIAL_CART_STATE, {
      type: "OPTIMISTIC_ADD",
      productId: sampleProduct.id,
      quantity: 1,
      maxStock: 5,
    });
    const cleared = cartReducer(seeded, {
      type: "OPTIMISTIC_UPDATE",
      productId: sampleProduct.id,
      quantity: 0,
      maxStock: 5,
    });
    expect(cleared.items).toHaveLength(0);
  });

  it("restores previous items on ROLLBACK", () => {
    const previous = [{ productId: sampleProduct.id, quantity: 1, addedAt: "2026-01-01" }];
    const rolledBack = cartReducer(
      { ...INITIAL_CART_STATE, items: [], isSyncing: true },
      { type: "ROLLBACK", previousItems: previous }
    );
    expect(rolledBack.items).toEqual(previous);
    expect(rolledBack.isSyncing).toBe(false);
  });
});

function CartHarness() {
  const { pricing, hydratedItems } = useCartState();
  const { addItem, applyCoupon } = useCartActions();

  return (
    <div>
      <span data-testid="count">{pricing.itemCount}</span>
      <span data-testid="total">{pricing.totalCents}</span>
      <span data-testid="lines">{hydratedItems.length}</span>
      <button type="button" onClick={() => void addItem(sampleProduct, 1)}>
        Add Item
      </button>
      <button type="button" onClick={() => applyCoupon("WELCOME10")}>
        Apply Coupon
      </button>
    </div>
  );
}

describe("CartProvider optimistic updates & rollback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, "getSession").mockResolvedValue(null);
    vi.spyOn(cartService, "fetchCart").mockResolvedValue([]);
  });

  it("adds items optimistically and reconciles with server response", async () => {
    const user = userEvent.setup();
    vi.spyOn(cartService, "addItem").mockResolvedValue([
      { productId: sampleProduct.id, quantity: 1, addedAt: "2026-01-01" },
    ]);

    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider products={[sampleProduct]}>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("lines")).toHaveTextContent("1");
    });
  });

  it("rolls back optimistic state when the API call rejects", async () => {
    const user = userEvent.setup();
    vi.spyOn(cartService, "addItem").mockRejectedValue(new Error("Network error"));

    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider products={[sampleProduct]}>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });
  });
});
