import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS_CATALOG } from "@/server/data/products";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const query = searchParams.get("q")?.trim().toLowerCase();
  const sort = searchParams.get("sort") ?? "featured";

  let results = [...PRODUCTS_CATALOG];

  if (category && category !== "All") {
    results = results.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  if (query) {
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }

  switch (sort) {
    case "price-asc":
      results.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      results.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "rating":
      results.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    default:
      break;
  }

  return NextResponse.json({
    products: results,
    total: results.length,
  });
}
