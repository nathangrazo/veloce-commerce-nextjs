import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/features/catalog/ProductDetailView";
import { getProductBySlug, PRODUCTS_CATALOG } from "@/server/data/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PRODUCTS_CATALOG.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = PRODUCTS_CATALOG.filter((item) => item.id !== product.id).slice(0, 4);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
