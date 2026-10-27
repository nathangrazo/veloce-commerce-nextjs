import type { CreateOrderInput } from "@/domain/schemas";
import type { Order } from "@/domain/types";
import { apiFetch } from "./http";

export const orderService = {
  async listOrders(): Promise<Order[]> {
    const data = await apiFetch<{ orders: Order[] }>("/api/orders", {
      method: "GET",
      cache: "no-store",
    });
    return data.orders;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const data = await apiFetch<{ order: Order }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.order;
  },

  async resetDemoData(): Promise<void> {
    await apiFetch<{ ok: boolean }>("/api/demo/reset", {
      method: "POST",
    });
  },
};
