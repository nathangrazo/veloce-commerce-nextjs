import type { Metadata } from "next";
import { CartPageView } from "@/features/cart/CartPageView";

export const metadata: Metadata = {
  title: "Shopping Cart",
};

export default function CartPage() {
  return <CartPageView />;
}
