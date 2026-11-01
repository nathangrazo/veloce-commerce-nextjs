"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCartActions } from "@/contexts/CartContext";
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import type { Product } from "@/domain/types";
import { formatCurrency } from "@/lib/format";
import { ProductCard } from "./ProductCard";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { addItem } = useCartActions();
  const { recordView } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    recordView(product.id);
  }, [product.id, recordView]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to catalog</span>
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-[#f3f2ef]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{product.category}</Badge>
            {product.badge ? <Badge variant="accent">{product.badge}</Badge> : null}
            <span className="inline-flex items-center gap-1 font-mono text-xs text-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-base text-muted">{product.subtitle}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold text-foreground">
              {formatCurrency(product.priceCents)}
            </span>
            {product.compareAtPriceCents ? (
              <span className="font-mono text-base text-muted line-through">
                {formatCurrency(product.compareAtPriceCents)}
              </span>
            ) : null}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex h-12 items-center justify-between rounded-xl border border-border bg-surface px-2 sm:w-36">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-subtle hover:text-foreground cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono text-sm font-semibold text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-subtle hover:text-foreground cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              onClick={() => void addItem(product, quantity, { openDrawer: true })}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>
                Add to Bag · {formatCurrency(product.priceCents * quantity)}
              </span>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 text-xs text-muted sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>{product.stock} in stock</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-highlight shrink-0" />
              <span>Free shipping $250+</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-foreground shrink-0" />
              <span>2-year guarantee</span>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Specifications
            </h2>
            <dl className="mt-4 divide-y divide-border text-sm">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">{spec.label}</dt>
                  <dd className="text-right font-medium text-foreground">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="mt-20">
          <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
            Pairs well with
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
