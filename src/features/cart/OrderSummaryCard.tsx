"use client";

import { useState, type FormEvent } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartActions, useCartState } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/format";

interface OrderSummaryCardProps {
  actionSlot?: React.ReactNode;
  allowCouponEdit?: boolean;
}

export function OrderSummaryCard({
  actionSlot,
  allowCouponEdit = true,
}: OrderSummaryCardProps) {
  const { pricing } = useCartState();
  const { applyCoupon, removeCoupon } = useCartActions();
  const [codeInput, setCodeInput] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleApplyCoupon(event: FormEvent) {
    event.preventDefault();
    if (!codeInput.trim()) return;
    const result = applyCoupon(codeInput);
    setFeedback(result);
    if (result.ok) {
      setCodeInput("");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-foreground">Order Summary</h2>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between text-muted">
          <dt>Items ({pricing.itemCount})</dt>
          <dd className="font-mono text-foreground">{formatCurrency(pricing.subtotalCents)}</dd>
        </div>

        {pricing.appliedCoupon ? (
          <div className="flex items-center justify-between text-success">
            <dt className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              <span>Coupon {pricing.appliedCoupon.code}</span>
              {allowCouponEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    removeCoupon();
                    setFeedback(null);
                  }}
                  aria-label="Remove coupon"
                  className="rounded p-0.5 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </dt>
            <dd className="font-mono">
              {pricing.discountCents > 0
                ? `-${formatCurrency(pricing.discountCents)}`
                : "Free Ship"}
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-muted">
          <dt>Express Shipping</dt>
          <dd className="font-mono text-foreground">
            {pricing.shippingCents === 0 ? "Free" : formatCurrency(pricing.shippingCents)}
          </dd>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
          <dt>Total</dt>
          <dd className="font-mono">{formatCurrency(pricing.totalCents)}</dd>
        </div>
      </dl>

      {allowCouponEdit ? (
        <form onSubmit={handleApplyCoupon} className="mt-5 space-y-2">
          <label
            htmlFor="coupon-code"
            className="block text-[11px] font-medium uppercase tracking-wider text-muted"
          >
            Promo code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder="WELCOME10 or FREESHIP"
              className="h-10 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-xs uppercase text-foreground placeholder:normal-case placeholder:font-sans placeholder:text-muted/70 focus:border-highlight focus:outline-none"
            />
            <Button type="submit" variant="secondary" size="md">
              Apply
            </Button>
          </div>
          {feedback ? (
            <p className={feedback.ok ? "text-xs text-success" : "text-xs text-danger"}>
              {feedback.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {actionSlot ? <div className="mt-6">{actionSlot}</div> : null}
    </div>
  );
}
