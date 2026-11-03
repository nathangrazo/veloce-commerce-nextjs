"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartActions, useCartState } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/format";

export function CartDrawer() {
  const { hydratedItems, pricing, isDrawerOpen, isSyncing } = useCartState();
  const { closeDrawer, updateQuantity, removeItem } = useCartActions();

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const freeShippingProgress = Math.min(
    100,
    Math.round(
      ((pricing.freeShippingThresholdCents - pricing.remainingForFreeShippingCents) /
        pricing.freeShippingThresholdCents) *
        100
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-4 w-4 text-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              Your Bag{" "}
              <span className="font-mono text-xs text-muted">({pricing.itemCount})</span>
            </h2>
            {isSyncing ? (
              <span className="text-[11px] font-medium text-muted">Syncing…</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close bag"
            className="rounded-lg p-1.5 text-muted hover:bg-surface-subtle hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {hydratedItems.length > 0 ? (
          <div className="border-b border-border bg-surface-subtle/60 px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Truck className="h-3.5 w-3.5 text-highlight shrink-0" />
              {pricing.remainingForFreeShippingCents === 0 ? (
                <span className="font-medium">You unlocked complimentary express shipping.</span>
              ) : (
                <span>
                  Add{" "}
                  <strong className="font-mono">
                    {formatCurrency(pricing.remainingForFreeShippingCents)}
                  </strong>{" "}
                  more for free shipping.
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {hydratedItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle text-muted">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">Your bag is empty</p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                Explore our studio collection and add pieces to see real-time Context API
                state synchronization.
              </p>
              <Button className="mt-5" onClick={closeDrawer}>
                Continue browsing
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {hydratedItems.map(({ product, quantity, lineTotalCents }) => (
                <li key={product.id} className="flex gap-4 py-4 first:pt-0">
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={closeDrawer}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f3f2ef]"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={closeDrawer}
                          className="block truncate text-sm font-medium text-foreground hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted">{product.category}</p>
                      </div>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {formatCurrency(lineTotalCents)}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-border bg-surface">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${product.name}`}
                          onClick={() => void updateQuantity(product.id, quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-medium text-foreground">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${product.name}`}
                          disabled={quantity >= product.stock}
                          onClick={() => void updateQuantity(product.id, quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeItem(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="rounded-lg p-1.5 text-muted hover:bg-surface-subtle hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hydratedItems.length > 0 ? (
          <div className="border-t border-border bg-surface px-6 py-5">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">
                  {formatCurrency(pricing.subtotalCents)}
                </span>
              </div>
              {pricing.discountCents > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Discount ({pricing.appliedCoupon?.code})</span>
                  <span className="font-mono">-{formatCurrency(pricing.discountCents)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span className="font-mono text-foreground">
                  {pricing.shippingCents === 0 ? "Free" : formatCurrency(pricing.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2.5 text-base font-semibold text-foreground">
                <span>Estimated total</span>
                <span className="font-mono">{formatCurrency(pricing.totalCents)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="flex h-11 items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                <span>Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
