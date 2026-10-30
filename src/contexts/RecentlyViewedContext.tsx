"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { recentlyViewedStorageSchema } from "@/domain/schemas";
import type { Product } from "@/domain/types";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

export const RECENTLY_VIEWED_STORAGE_KEY = "veloce:recently_viewed";
const RECENT_CHANGE_EVENT = "veloce:recent-change";
const MAX_RECENT_ITEMS = 6;
const EMPTY_SNAPSHOT = "[]";

interface RecentlyViewedContextValue {
  recentIds: string[];
  recentProducts: Product[];
  recordView: (productId: string) => void;
  clearHistory: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

function subscribeRecent(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(RECENT_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(RECENT_CHANGE_EVENT, handler);
  };
}

function getRecentSnapshot(): string {
  const items = readStorage(RECENTLY_VIEWED_STORAGE_KEY, recentlyViewedStorageSchema, []);
  return JSON.stringify(items.slice(0, MAX_RECENT_ITEMS));
}

function getRecentServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

interface RecentlyViewedProviderProps {
  products: Product[];
  children: ReactNode;
}

export function RecentlyViewedProvider({ products, children }: RecentlyViewedProviderProps) {
  const serialized = useSyncExternalStore(
    subscribeRecent,
    getRecentSnapshot,
    getRecentServerSnapshot
  );

  const recentIds = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(serialized) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }, [serialized]);

  const recordView = useCallback((productId: string) => {
    const current = readStorage(RECENTLY_VIEWED_STORAGE_KEY, recentlyViewedStorageSchema, []);
    // Deduplicated LRU insertion: move viewed item to the front
    const next = [productId, ...current.filter((id) => id !== productId)].slice(
      0,
      MAX_RECENT_ITEMS
    );
    writeStorage(RECENTLY_VIEWED_STORAGE_KEY, next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
    }
  }, []);

  const clearHistory = useCallback(() => {
    removeStorage(RECENTLY_VIEWED_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
    }
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const recentProducts = useMemo(
    () =>
      recentIds
        .map((id) => productMap.get(id))
        .filter((product): product is Product => Boolean(product)),
    [recentIds, productMap]
  );

  const value = useMemo<RecentlyViewedContextValue>(
    () => ({
      recentIds,
      recentProducts,
      recordView,
      clearHistory,
    }),
    [recentIds, recentProducts, recordView, clearHistory]
  );

  return (
    <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider.");
  }
  return context;
}
