"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartActions, useCartState } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/format";
import { OrderSummaryCard } from "./OrderSummaryCard";

export function CartPageView() {
  const { hydratedItems, isHydrated } = useCartState();
  const { updateQuantity, removeItem, clearCart } = useCartActions();

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-surface-subtle" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-2xl bg-surface-subtle lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-subtle lg:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Continue shopping</span>
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Shopping Cart
          </h1>
        </div>

        {hydratedItems.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => void clearCart()}>
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear cart</span>
          </Button>
        ) : null}
      </div>

      {hydratedItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle text-muted">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Your cart is empty</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Add products from the storefront to preview real-time pricing, coupons, and
            server-synced persistence.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <span>Explore catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {hydratedItems.map(({ product, quantity, lineTotalCents }) => (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f3f2ef]"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        {product.category}
                      </p>
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-base font-semibold text-foreground hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatCurrency(product.priceCents)} each
                      </p>
                    </div>

                    <p className="font-mono text-base font-semibold text-foreground">
                      {formatCurrency(lineTotalCents)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-xl border border-border bg-background">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${product.name}`}
                        onClick={() => void updateQuantity(product.id, quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center font-mono text-xs font-semibold text-foreground">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${product.name}`}
                        disabled={quantity >= product.stock}
                        onClick={() => void updateQuantity(product.id, quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => void removeItem(product.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-subtle hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <OrderSummaryCard
              actionSlot={
                <Link
                  href="/checkout"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
