"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Package, Settings, ShoppingBag, Sun, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartActions, useCartState } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/", label: "Store" },
  { href: "/orders", label: "Orders" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const { pricing } = useCartState();
  const { openDrawer } = useCartActions();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { notify } = useToast();

  async function handleLogout() {
    await logout();
    notify({
      tone: "info",
      title: "Signed out",
      description: "You can sign back in anytime with the demo account.",
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-foreground focus-visible:outline-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold tracking-tight text-accent-foreground transition-transform group-hover:scale-105">
              V
            </span>
            <div className="leading-none">
              <span className="block text-sm font-semibold tracking-tight">VELOCE</span>
              <span className="hidden text-[10px] font-medium tracking-[0.18em] text-muted uppercase sm:block">
                Studio Objects
              </span>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-subtle text-foreground"
                      : "text-muted hover:bg-surface-subtle/60 hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-subtle hover:text-foreground cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/orders"
            aria-label="Order history"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-subtle hover:text-foreground md:hidden"
          >
            <Package className="h-4 w-4" />
          </Link>

          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-subtle hover:text-foreground md:hidden"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open shopping bag (${pricing.itemCount} items)`}
            className="relative flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Bag</span>
            <span
              data-testid="cart-badge"
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold transition-all",
                pricing.itemCount > 0
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-subtle text-muted"
              )}
            >
              {pricing.itemCount}
            </span>
          </button>

          {status === "authenticated" && user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/settings"
                className="hidden h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-subtle sm:flex"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-subtle hover:text-foreground cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-2.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent-hover sm:px-3.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
