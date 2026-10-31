"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useCartActions } from "@/contexts/CartContext";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import type { Product } from "@/domain/types";
import { formatCurrency } from "@/lib/format";

interface ProductCardProps {
  product: Product;
}

/**
 * Intentionally subscribes only to `useCartActions()` (stable dispatch context)
 * so adding an item to the cart never triggers unnecessary re-renders across sibling cards.
 */
export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartActions();
  const { recordView } = useRecentlyViewed();

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        onClick={() => recordView(product.id)}
        className="relative aspect-square w-full overflow-hidden bg-[#f3f2ef]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge ? (
          <div className="absolute top-3 left-3">
            <Badge
              variant={product.badge === "Best Seller" ? "accent" : "neutral"}
              className="shadow-xs backdrop-blur-sm"
            >
              {product.badge}
            </Badge>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="font-medium uppercase tracking-wider text-[10px]">
            {product.category}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
            <span className="text-muted">({product.reviewCount})</span>
          </span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          onClick={() => recordView(product.id)}
          className="mt-1.5 block text-sm font-semibold text-foreground transition-colors hover:text-highlight"
        >
          {product.name}
        </Link>

        <p className="mt-1 line-clamp-2 text-xs text-muted">{product.subtitle}</p>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-semibold text-foreground">
              {formatCurrency(product.priceCents)}
            </span>
            {product.compareAtPriceCents ? (
              <span className="font-mono text-xs text-muted line-through">
                {formatCurrency(product.compareAtPriceCents)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              recordView(product.id);
              void addItem(product, 1);
            }}
            aria-label={`Add ${product.name} to bag`}
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-accent px-3 text-xs font-medium text-accent-foreground transition-all hover:bg-accent-hover active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
