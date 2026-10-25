import type { CartItem } from "@/domain/types";
import { apiFetch } from "./http";

export const cartService = {
  async fetchCart(): Promise<CartItem[]> {
    const data = await apiFetch<{ items: CartItem[] }>("/api/cart", {
      method: "GET",
      cache: "no-store",
    });
    return data.items;
  },

  async addItem(productId: string, quantity = 1): Promise<CartItem[]> {
    const data = await apiFetch<{ items: CartItem[] }>("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    return data.items;
  },

  async updateQuantity(productId: string, quantity: number): Promise<CartItem[]> {
    const data = await apiFetch<{ items: CartItem[] }>("/api/cart", {
      method: "PATCH",
      body: JSON.stringify({ productId, quantity }),
    });
    return data.items;
  },

  async removeItem(productId: string): Promise<CartItem[]> {
    const data = await apiFetch<{ items: CartItem[] }>(
      `/api/cart?productId=${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
      }
    );
    return data.items;
  },

  async clearCart(): Promise<CartItem[]> {
    const data = await apiFetch<{ items: CartItem[] }>("/api/cart", {
      method: "DELETE",
    });
    return data.items;
  },
};
