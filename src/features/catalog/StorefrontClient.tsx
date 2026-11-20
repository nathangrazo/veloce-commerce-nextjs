"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, ProductCategory } from "@/domain/types";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";
import { RecentlyViewedStrip } from "./RecentlyViewedStrip";

const CATEGORIES: Array<"All" | ProductCategory> = [
  "All",
  "Furniture",
  "Workspace",
  "Apparel",
];

type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

interface StorefrontClientProps {
  products: Product[];
}

export function StorefrontClient({ products }: StorefrontClientProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"All" | ProductCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const list = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.subtitle.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });

    switch (sortBy) {
      case "price-asc":
        return [...list].sort((a, b) => a.priceCents - b.priceCents);
      case "price-desc":
        return [...list].sort((a, b) => b.priceCents - a.priceCents);
      case "rating":
        return [...list].sort(
          (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
        );
      default:
        return list;
    }
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Editorial Hero */}
      <section className="relative mb-12 overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-highlight" />
            <span>
              {user
                ? `Welcome back, ${user.name.split(" ")[0]} — free express shipping over $250`
                : "Architectural Objects — Free express shipping over $250"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            Considered essentials for focused living and work.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Furniture, audio hardware, and everyday apparel built for daily use. Use code{" "}
            <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
              WELCOME10
            </span>{" "}
            at checkout for 10% off your first order.
          </p>
        </div>
      </section>

      {/* Recently Viewed Strip (powered by RecentlyViewedContext + localStorage) */}
      <RecentlyViewedStrip />

      {/* Filter & Search Toolbar */}
      <section
        aria-label="Catalog filters"
        className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-accent text-accent-foreground shadow-xs"
                    : "border border-border bg-surface text-muted hover:bg-surface-subtle hover:text-foreground"
                )}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search catalog..."
              aria-label="Search catalog"
              className="h-10 w-full rounded-xl border border-border bg-surface pr-9 pl-10 text-sm text-foreground placeholder:text-muted/70 focus:border-highlight focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="relative inline-flex items-center">
            <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 appearance-none rounded-xl border border-border bg-surface py-0 pr-8 pl-9 text-xs leading-10 font-medium text-foreground focus:border-highlight focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">No matching objects found</p>
          <p className="mt-1 text-xs text-muted">
            Try clearing your search query or switching to another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:bg-accent-hover cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
