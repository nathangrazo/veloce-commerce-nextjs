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

const sneakers: Product = {
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

const lamp: Product = {
  id: "prod_lumen_lamp",
  slug: "lumen-cantilever-lamp",
  name: "Lumen Desk Lamp",
  subtitle: "Anodized aluminum",
  description: "Test lamp",
  priceCents: 16500,
  category: "Workspace",
  image: "/images/products/lamp.jpg",
  rating: 4.7,
  reviewCount: 78,
  stock: 5,
  specs: [],
};

describe("cartReducer", () => {
  it("optimistically adds a new item and clamps quantity to available stock", () => {
    const added = cartReducer(INITIAL_CART_STATE, {
      type: "OPTIMISTIC_ADD",
      productId: sneakers.id,
      quantity: 2,
      maxStock: sneakers.stock,
    });
    expect(added.items).toHaveLength(1);
    expect(added.items[0]?.quantity).toBe(2);
    expect(added.isSyncing).toBe(true);

    const clamped = cartReducer(added, {
      type: "OPTIMISTIC_ADD",
      productId: sneakers.id,
      quantity: 5,
      maxStock: sneakers.stock,
    });
    expect(clamped.items[0]?.quantity).toBe(3);
  });

  it("removes an item when quantity is updated to zero", () => {
    const seeded = cartReducer(INITIAL_CART_STATE, {
      type: "OPTIMISTIC_ADD",
      productId: sneakers.id,
      quantity: 1,
      maxStock: 5,
    });
    const cleared = cartReducer(seeded, {
      type: "OPTIMISTIC_UPDATE",
      productId: sneakers.id,
      quantity: 0,
      maxStock: 5,
    });
    expect(cleared.items).toHaveLength(0);
  });

  it("clears syncing flag on SYNC_FAILED without corrupting state", () => {
    const next = cartReducer(
      { ...INITIAL_CART_STATE, isSyncing: true },
      { type: "SYNC_FAILED" }
    );
    expect(next.isSyncing).toBe(false);
  });
});

function CartHarness() {
  const { pricing, hydratedItems } = useCartState();
  const { addItem } = useCartActions();

  return (
    <div>
      <span data-testid="count">{pricing.itemCount}</span>
      <span data-testid="product-ids">
        {hydratedItems.map((entry) => entry.product.id).join(",")}
      </span>
      <button type="button" onClick={() => void addItem(sneakers, 1)}>
        Add Sneakers
      </button>
      <button type="button" onClick={() => void addItem(lamp, 1)}>
        Add Lamp
      </button>
    </div>
  );
}

describe("CartProvider queued optimistic updates", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, "getSession").mockResolvedValue(null);
    vi.spyOn(cartService, "fetchCart").mockResolvedValue([]);
  });

  it("adds items optimistically and reconciles with server response", async () => {
    const user = userEvent.setup();
    vi.spyOn(cartService, "addItem").mockResolvedValue([
      { productId: sneakers.id, quantity: 1, addedAt: "2026-01-01" },
    ]);

    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider products={[sneakers, lamp]}>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add Sneakers" }));

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("product-ids")).toHaveTextContent(sneakers.id);
    });
  });

  it("reconciles with server truth when a standalone mutation fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(cartService, "addItem").mockRejectedValue(new Error("Network error"));
    const fetchSpy = vi.spyOn(cartService, "fetchCart").mockResolvedValue([]);

    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider products={[sneakers, lamp]}>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add Sneakers" }));

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  it("does not clobber a newer successful mutation when an earlier queued mutation fails", async () => {
    const user = userEvent.setup();

    let rejectFirst!: (reason?: unknown) => void;
    const firstPromise = new Promise<never>((_resolve, reject) => {
      rejectFirst = reject;
    });

    const addSpy = vi
      .spyOn(cartService, "addItem")
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce([{ productId: lamp.id, quantity: 1, addedAt: "2026-01-01" }]);

    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider products={[sneakers, lamp]}>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    );

    // Fire two rapid consecutive mutations
    await user.click(screen.getByRole("button", { name: "Add Sneakers" }));
    await user.click(screen.getByRole("button", { name: "Add Lamp" }));

    // Reject the first request after the second has already been queued
    rejectFirst(new Error("Transient 503 on first item"));

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("product-ids")).toHaveTextContent(lamp.id);
    });
  });
});
