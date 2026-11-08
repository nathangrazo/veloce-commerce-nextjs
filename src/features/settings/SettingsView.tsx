"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Laptop, Moon, RotateCcw, Save, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useCartActions } from "@/contexts/CartContext";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { updateProfileSchema } from "@/domain/schemas";
import type { ThemeMode } from "@/domain/types";
import { cn } from "@/lib/cn";
import { orderService } from "@/services/order.service";

const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  { mode: "light", label: "Light", description: "Warm alabaster studio palette", icon: Sun },
  { mode: "dark", label: "Dark", description: "Low-glare obsidian workspace", icon: Moon },
  { mode: "system", label: "System", description: "Matches OS color scheme", icon: Laptop },
];

export function SettingsView() {
  const { mode, resolvedTheme, setTheme } = useTheme();
  const { user, status, updateProfile, refreshSession } = useAuth();
  const { syncCart } = useCartActions();
  const { clearHistory } = useRecentlyViewed();
  const { notify } = useToast();

  const [draft, setDraft] = useState<Partial<{
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const formState = {
    name: draft.name ?? user?.name ?? "",
    phone: draft.phone ?? user?.phone ?? "",
    street: draft.street ?? user?.address.street ?? "",
    city: draft.city ?? user?.address.city ?? "",
    state: draft.state ?? user?.address.state ?? "",
    zipCode: draft.zipCode ?? user?.address.zipCode ?? "",
    country: draft.country ?? user?.address.country ?? "",
  };

  function updateField(field: keyof typeof formState, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    const parsed = updateProfileSchema.safeParse({
      name: formState.name,
      phone: formState.phone,
      address: {
        street: formState.street,
        city: formState.city,
        state: formState.state,
        zipCode: formState.zipCode,
        country: formState.country,
      },
    });

    if (!parsed.success) {
      notify({
        tone: "error",
        title: "Invalid profile fields",
        description: parsed.error.issues[0]?.message ?? "Check your input and try again.",
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile(parsed.data);
      setDraft({});
      notify({
        tone: "success",
        title: "Profile updated",
        description: "Your default shipping details are saved for future checkouts.",
      });
    } catch {
      notify({
        tone: "error",
        title: "Could not save profile",
        description: "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDemo() {
    setResetting(true);
    try {
      await orderService.resetDemoData();
      clearHistory();
      setDraft({});
      await Promise.all([syncCart(), refreshSession()]);
      notify({
        tone: "info",
        title: "Demo environment reset",
        description: "Cart, orders, profile defaults, and browsing history were cleared.",
      });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted">
        Manage persistent theme preferences, delivery profile, and local demo storage.
      </p>

      <div className="mt-8 space-y-6">
        {/* Theme Context Control */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Appearance</h2>
              <p className="text-xs text-muted">
                Powered by <code className="font-mono">ThemeContext</code> with{" "}
                <code className="font-mono">localStorage</code> persistence and FOUC prevention.
              </p>
            </div>
            <span className="rounded-full bg-surface-subtle px-3 py-1 font-mono text-xs text-muted">
              Active: {resolvedTheme}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = mode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setTheme(option.mode)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-start rounded-2xl border p-4 text-left transition-all cursor-pointer",
                    selected
                      ? "border-accent bg-surface-subtle ring-1 ring-accent"
                      : "border-border bg-background hover:bg-surface-subtle/50"
                  )}
                >
                  <Icon className="h-4 w-4 text-foreground" />
                  <span className="mt-3 text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-0.5 text-xs text-muted">{option.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Account Profile Context */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-base font-semibold text-foreground">Delivery Profile</h2>
          <p className="mt-1 text-xs text-muted">
            Synced across <code className="font-mono">AuthContext</code> and pre-filled at
            checkout.
          </p>

          {status === "authenticated" && user ? (
            <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  name="name"
                  value={formState.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={formState.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Street address"
                    name="street"
                    value={formState.street}
                    onChange={(e) => updateField("street", e.target.value)}
                  />
                </div>
                <Input
                  label="City"
                  name="city"
                  value={formState.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="State"
                    name="state"
                    value={formState.state}
                    onChange={(e) => updateField("state", e.target.value)}
                  />
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    value={formState.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Country"
                    name="country"
                    value={formState.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Profile"}</span>
              </Button>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted">
                Sign in with the demo account to customize your saved delivery address.
              </p>
              <Link
                href="/login?next=/settings"
                className="rounded-xl bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent-hover"
              >
                Sign In
              </Link>
            </div>
          )}
        </section>

        {/* Demo State Controls */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Demo Sandbox</h2>
              <p className="mt-1 text-xs text-muted">
                Reset cart items, order history, recently viewed products, and default profile.
              </p>
            </div>

            <Button variant="secondary" onClick={() => void handleResetDemo()} disabled={resetting}>
              <RotateCcw className="h-4 w-4" />
              <span>{resetting ? "Resetting..." : "Reset Demo Data"}</span>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
