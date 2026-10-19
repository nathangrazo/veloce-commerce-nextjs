export type ProductCategory = "Furniture" | "Apparel" | "Workspace";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  priceCents: number;
  compareAtPriceCents?: number;
  category: ProductCategory;
  image: string;
  rating: number;
  reviewCount: number;
  stock: number;
  badge?: "Best Seller" | "New Arrival" | "Limited";
  specs: ProductSpec[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface HydratedCartItem {
  product: Product;
  quantity: number;
  lineTotalCents: number;
}

export type CouponCode = "WELCOME10" | "FREESHIP";

export interface Coupon {
  code: CouponCode;
  description: string;
  discountPercent?: number;
  freeShipping?: boolean;
}

export interface PricingBreakdown {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
  freeShippingThresholdCents: number;
  remainingForFreeShippingCents: number;
  appliedCoupon: Coupon | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export type PaymentMethod = "credit_card" | "pix" | "apple_pay";

export type OrderStatus = "confirmed" | "processing" | "shipped";

export interface OrderLineItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: {
    recipientName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderLineItem[];
  pricing: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    totalCents: number;
    couponCode: CouponCode | null;
  };
}

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
