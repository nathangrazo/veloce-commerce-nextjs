import type { Metadata } from "next";
import { OrdersView } from "@/features/orders/OrdersView";

export const metadata: Metadata = {
  title: "Order History",
};

export default function OrdersPage() {
  return <OrdersView />;
}
