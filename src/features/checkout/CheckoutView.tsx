"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useCartActions, useCartState } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { OrderSummaryCard } from "@/features/cart/OrderSummaryCard";
import { shippingAddressSchema } from "@/domain/schemas";
import type { Order, PaymentMethod } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ApiError } from "@/services/http";
import { orderService } from "@/services/order.service";

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  caption: string;
  icon: typeof CreditCard;
}> = [
  { id: "credit_card", label: "Credit Card", caption: "Instant authorization", icon: CreditCard },
  { id: "pix", label: "Instant Transfer / PIX", caption: "Zero processing delay", icon: QrCode },
  { id: "apple_pay", label: "Express Wallet", caption: "One-tap confirmation", icon: Smartphone },
];

export function CheckoutView() {
  const { user, status } = useAuth();
  const { hydratedItems, couponCode, isHydrated } = useCartState();
  const { syncCart, removeCoupon } = useCartActions();
  const { notify } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [draft, setDraft] = useState<Partial<{
    recipientName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const formValues = {
    recipientName: draft.recipientName ?? user?.name ?? "",
    email: draft.email ?? user?.email ?? "",
    phone: draft.phone ?? user?.phone ?? "",
    street: draft.street ?? user?.address.street ?? "",
    city: draft.city ?? user?.address.city ?? "",
    state: draft.state ?? user?.address.state ?? "",
    zipCode: draft.zipCode ?? user?.address.zipCode ?? "",
    country: draft.country ?? user?.address.country ?? "",
  };

  function updateField(field: keyof typeof formValues, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-border bg-surface p-8 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            Order Confirmed · {placedOrder.id}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Thank you, {placedOrder.shippingAddress.recipientName.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Placed on {formatDateTime(placedOrder.createdAt)}. Your order total was verified
            server-side and persisted to your account history.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Shipping to
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              {placedOrder.shippingAddress.recipientName}
            </p>
            <p className="text-xs text-muted">
              {placedOrder.shippingAddress.street}, {placedOrder.shippingAddress.city},{" "}
              {placedOrder.shippingAddress.state} {placedOrder.shippingAddress.zipCode} ·{" "}
              {placedOrder.shippingAddress.country}
            </p>
            <p className="mt-1 text-xs text-muted">
              {placedOrder.shippingAddress.email} · {placedOrder.shippingAddress.phone}
            </p>
          </div>

          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-background px-5">
            {placedOrder.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-3.5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f3f2ef]">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted">Qty {item.quantity}</p>
                </div>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {formatCurrency(item.lineTotalCents)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
            <span>Total Paid</span>
            <span className="font-mono">{formatCurrency(placedOrder.pricing.totalCents)}</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              <span>View Order History</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-surface-subtle"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading" || !isHydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-surface-subtle" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl bg-surface-subtle lg:col-span-7" />
          <div className="h-72 animate-pulse rounded-2xl bg-surface-subtle lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Sign in to checkout</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in with our one-click demo account so your cart merges seamlessly and your
            order is saved to your order history.
          </p>
          <Link
            href="/login?next=/checkout"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <span>Continue to Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (hydratedItems.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <h1 className="text-xl font-semibold text-foreground">Nothing to check out</h1>
          <p className="mt-2 text-sm text-muted">
            Your shopping bag is currently empty. Add at least one item before checking out.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = shippingAddressSchema.safeParse(formValues);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      notify({
        tone: "error",
        title: "Missing shipping details",
        description: "Please review the highlighted fields before placing your order.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.createOrder({
        paymentMethod,
        shippingAddress: parsed.data,
        couponCode,
      });
      removeCoupon();
      await syncCart();
      setPlacedOrder(order);
      notify({
        tone: "success",
        title: `Order ${order.id} placed`,
        description: "Your confirmation receipt is ready.",
      });
    } catch (err) {
      notify({
        tone: "error",
        title: "Checkout failed",
        description: err instanceof ApiError ? err.message : "Please try again shortly.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to cart</span>
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Checkout
      </h1>

      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12"
      >
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold text-foreground">Delivery Information</h2>
            <p className="mt-1 text-xs text-muted">
              Pre-populated from your authenticated profile context.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Full name"
                  name="recipientName"
                  value={formValues.recipientName}
                  onChange={(e) => updateField("recipientName", e.target.value)}
                  error={fieldErrors.recipientName}
                />
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                value={formValues.email}
                onChange={(e) => updateField("email", e.target.value)}
                error={fieldErrors.email}
              />

              <Input
                label="Phone"
                name="phone"
                value={formValues.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                error={fieldErrors.phone}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Street address"
                  name="street"
                  value={formValues.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  error={fieldErrors.street}
                />
              </div>

              <Input
                label="City"
                name="city"
                value={formValues.city}
                onChange={(e) => updateField("city", e.target.value)}
                error={fieldErrors.city}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="State"
                  name="state"
                  value={formValues.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  error={fieldErrors.state}
                />
                <Input
                  label="ZIP Code"
                  name="zipCode"
                  value={formValues.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  error={fieldErrors.zipCode}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Country"
                  name="country"
                  value={formValues.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  error={fieldErrors.country}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold text-foreground">Payment Method</h2>
            <p className="mt-1 text-xs text-muted">
              Simulated checkout — no real payment card is charged.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentMethod(option.id)}
                    className={cn(
                      "flex flex-col items-start rounded-xl border p-4 text-left transition-all cursor-pointer",
                      active
                        ? "border-accent bg-surface-subtle ring-1 ring-accent"
                        : "border-border bg-background hover:bg-surface-subtle/50"
                    )}
                  >
                    <Icon className="h-4 w-4 text-foreground" />
                    <span className="mt-3 text-xs font-semibold text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 text-[11px] text-muted">{option.caption}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Items in Order ({hydratedItems.length})
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {hydratedItems.map(({ product, quantity, lineTotalCents }) => (
                <li key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f3f2ef]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-muted">Qty {quantity}</p>
                  </div>
                  <p className="font-mono text-xs font-semibold text-foreground">
                    {formatCurrency(lineTotalCents)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <OrderSummaryCard
            allowCouponEdit={false}
            actionSlot={
              <div className="space-y-3">
                <Button
                  type="submit"
                  form="checkout-form"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  <span>{submitting ? "Placing Order..." : "Complete Order"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  <span>Prices verified server-side on submission</span>
                </p>
              </div>
            }
          />
        </div>
      </form>
    </div>
  );
}
