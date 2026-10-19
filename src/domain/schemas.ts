import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(3, "Password must be at least 3 characters."),
});

export const cartMutationSchema = z.object({
  productId: z.string().min(1, "Product ID is required."),
  quantity: z.number().int().min(1).max(20).optional().default(1),
});

export const cartUpdateSchema = z.object({
  productId: z.string().min(1, "Product ID is required."),
  quantity: z.number().int().min(0).max(20),
});

export const couponSchema = z.enum(["WELCOME10", "FREESHIP"]);

export const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Valid email address is required."),
  phone: z.string().trim().min(8, "Valid phone number is required."),
  street: z.string().trim().min(5, "Street address is required."),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State / region is required."),
  zipCode: z.string().trim().min(4, "ZIP / postal code is required."),
  country: z.string().trim().min(2, "Country is required."),
});

export const createOrderSchema = z.object({
  paymentMethod: z.enum(["credit_card", "pix", "apple_pay"]),
  shippingAddress: shippingAddressSchema,
  couponCode: couponSchema.nullable().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z.string().trim().min(8, "Phone number is too short."),
  address: z.object({
    street: z.string().trim().min(5, "Street address is required."),
    city: z.string().trim().min(2, "City is required."),
    state: z.string().trim().min(2, "State is required."),
    zipCode: z.string().trim().min(4, "ZIP code is required."),
    country: z.string().trim().min(2, "Country is required."),
  }),
});

export const recentlyViewedStorageSchema = z.array(z.string()).max(12);
export const themeStorageSchema = z.enum(["light", "dark", "system"]);

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
