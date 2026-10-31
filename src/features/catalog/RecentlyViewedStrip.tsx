"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { formatCurrency } from "@/lib/format";

export function RecentlyViewedStrip() {
  const { recentProducts, clearHistory } = useRecentlyViewed();

  if (recentProducts.length === 0) return null;

  return (
    <section aria-label="Recently viewed products" className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Recently Viewed
          </h2>
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 font-mono text-[11px] text-muted">
            {recentProducts.length}
          </span>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 transition-colors hover:border-foreground/25"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f3f2ef]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="56px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{product.name}</p>
              <p className="text-[11px] text-muted">{product.category}</p>
              <p className="mt-0.5 font-mono text-xs font-medium text-foreground">
                {formatCurrency(product.priceCents)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
