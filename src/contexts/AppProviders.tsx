"use client";

import type { ReactNode } from "react";
import type { Product } from "@/domain/types";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { RecentlyViewedProvider } from "./RecentlyViewedContext";
import { ThemeProvider } from "./ThemeContext";
import { ToastProvider } from "./ToastContext";

interface AppProvidersProps {
  initialProducts: Product[];
  children: ReactNode;
}

/**
 * Composed root provider tree.
 * Ordering guarantees dependencies flow strictly downward:
 * Theme -> Toast -> Auth -> Cart (depends on Auth + Toast) -> RecentlyViewed.
 */
export function AppProviders({ initialProducts, children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider products={initialProducts}>
            <RecentlyViewedProvider products={initialProducts}>{children}</RecentlyViewedProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
