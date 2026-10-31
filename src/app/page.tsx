import { StorefrontClient } from "@/features/catalog/StorefrontClient";
import { PRODUCTS_CATALOG } from "@/server/data/products";

export default function HomePage() {
  return <StorefrontClient products={PRODUCTS_CATALOG} />;
}
