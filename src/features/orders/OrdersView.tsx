"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import type { Order } from "@/domain/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { orderService } from "@/services/order.service";

export function OrdersView() {
  const { user, status } = useAuth();
  const [ordersState, setOrdersState] = useState<{
    loadedForUserId: string | null;
    items: Order[];
  }>({ loadedForUserId: null, items: [] });

  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    let active = true;
    const currentUserId = user.id;

    orderService
      .listOrders()
      .then((list) => {
        if (active) {
          setOrdersState({ loadedForUserId: currentUserId, items: list });
        }
      })
      .catch(() => {
        if (active) {
          setOrdersState({ loadedForUserId: currentUserId, items: [] });
        }
      });

    return () => {
      active = false;
    };
  }, [status, user]);

  const loading =
    status === "loading" ||
    (status === "authenticated" && ordersState.loadedForUserId !== user?.id);
  const orders = ordersState.items;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-surface-subtle" />
        <div className="mt-6 space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-surface-subtle" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface-subtle" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Sign in to view orders</h1>
          <p className="mt-2 text-sm text-muted">
            Your persisted order receipts are linked to your signed session account.
          </p>
          <Link
            href="/login?next=/orders"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Order History
          </h1>
          <p className="mt-1 text-sm text-muted">
            Completed purchases persisted through the Next.js API layer.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle text-muted">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No orders placed yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Add an item to your bag and complete checkout to inspect your persisted order
            receipt here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <span>Browse catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-subtle/50 px-6 py-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-muted">
                      Order ID
                    </span>
                    <span className="font-mono font-semibold text-foreground">{order.id}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-muted">
                      Placed
                    </span>
                    <span className="text-foreground">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-muted">
                      Total
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(order.pricing.totalCents)}
                    </span>
                  </div>
                </div>

                <Badge variant="success" className="capitalize">
                  {order.status}
                </Badge>
              </div>

              <ul className="divide-y divide-border px-6">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-4 py-4">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f3f2ef]"
                    >
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-xs text-muted">
                        Qty {item.quantity} · {formatCurrency(item.unitPriceCents)} each
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(item.lineTotalCents)}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
