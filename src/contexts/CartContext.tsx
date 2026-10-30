"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { calculatePricing, resolveCoupon } from "@/domain/pricing";
import type {
  CartItem,
  CouponCode,
  HydratedCartItem,
  PricingBreakdown,
  Product,
} from "@/domain/types";
import { cartService } from "@/services/cart.service";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

export interface CartReducerState {
  items: CartItem[];
  couponCode: CouponCode | null;
  isHydrated: boolean;
  isSyncing: boolean;
  isDrawerOpen: boolean;
}

export type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "OPTIMISTIC_ADD"; productId: string; quantity: number; maxStock: number }
  | { type: "OPTIMISTIC_UPDATE"; productId: string; quantity: number; maxStock: number }
  | { type: "OPTIMISTIC_REMOVE"; productId: string }
  | { type: "OPTIMISTIC_CLEAR" }
  | { type: "SYNC_SUCCESS"; items: CartItem[] }
  | { type: "ROLLBACK"; previousItems: CartItem[] }
  | { type: "SET_COUPON"; couponCode: CouponCode | null }
  | { type: "SET_DRAWER_OPEN"; open: boolean };

export const INITIAL_CART_STATE: CartReducerState = {
  items: [],
  couponCode: null,
  isHydrated: false,
  isSyncing: false,
  isDrawerOpen: false,
};

/**
 * Pure reducer governing all shopping cart transitions.
 * Exported directly for deterministic unit testing.
 */
export function cartReducer(state: CartReducerState, action: CartAction): CartReducerState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        items: action.items,
        isHydrated: true,
        isSyncing: false,
      };

    case "OPTIMISTIC_ADD": {
      const existing = state.items.find((item) => item.productId === action.productId);
      const nextItems = existing
        ? state.items.map((item) =>
            item.productId === action.productId
              ? {
                  ...item,
                  quantity: Math.min(action.maxStock, item.quantity + action.quantity),
                }
              : item
          )
        : [
            ...state.items,
            {
              productId: action.productId,
              quantity: Math.min(action.maxStock, action.quantity),
              addedAt: new Date().toISOString(),
            },
          ];

      return { ...state, items: nextItems, isSyncing: true };
    }

    case "OPTIMISTIC_UPDATE": {
      const nextItems =
        action.quantity <= 0
          ? state.items.filter((item) => item.productId !== action.productId)
          : state.items.map((item) =>
              item.productId === action.productId
                ? { ...item, quantity: Math.min(action.maxStock, action.quantity) }
                : item
            );
      return { ...state, items: nextItems, isSyncing: true };
    }

    case "OPTIMISTIC_REMOVE":
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.productId),
        isSyncing: true,
      };

    case "OPTIMISTIC_CLEAR":
      return {
        ...state,
        items: [],
        couponCode: null,
        isSyncing: true,
      };

    case "SYNC_SUCCESS":
      return {
        ...state,
        items: action.items,
        isSyncing: false,
        isHydrated: true,
      };

    case "ROLLBACK":
      return {
        ...state,
        items: action.previousItems,
        isSyncing: false,
      };

    case "SET_COUPON":
      return {
        ...state,
        couponCode: action.couponCode,
      };

    case "SET_DRAWER_OPEN":
      return {
        ...state,
        isDrawerOpen: action.open,
      };

    default:
      return state;
  }
}

interface CartStateContextValue {
  items: CartItem[];
  hydratedItems: HydratedCartItem[];
  pricing: PricingBreakdown;
  couponCode: CouponCode | null;
  isHydrated: boolean;
  isSyncing: boolean;
  isDrawerOpen: boolean;
}

interface CartActionsContextValue {
  addItem: (product: Product, quantity?: number, options?: { openDrawer?: boolean }) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  applyCoupon: (rawCode: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

/**
 * Split State & Actions Contexts:
 * Components that only dispatch mutations (e.g. every ProductCard in a large grid)
 * subscribe exclusively to `CartActionsContext` and never re-render when cart totals change.
 */
const CartStateContext = createContext<CartStateContextValue | null>(null);
const CartActionsContext = createContext<CartActionsContextValue | null>(null);

interface CartProviderProps {
  products: Product[];
  children: ReactNode;
}

export function CartProvider({ products, children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_CART_STATE);
  const { user, status: authStatus } = useAuth();
  const { notify } = useToast();

  // Keep a ref to latest items so optimistic rollbacks remain stable without recreating action callbacks
  const itemsRef = useRef<CartItem[]>(state.items);
  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const syncCart = useCallback(async () => {
    try {
      const serverItems = await cartService.fetchCart();
      dispatch({ type: "HYDRATE", items: serverItems });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  // Re-hydrate cart on initial mount and whenever authentication identity changes (guest -> user merge)
  useEffect(() => {
    if (authStatus === "loading") return;
    void syncCart();
  }, [authStatus, user?.id, syncCart]);

  const addItem = useCallback(
    async (product: Product, quantity = 1, options?: { openDrawer?: boolean }) => {
      const snapshot = itemsRef.current;
      dispatch({
        type: "OPTIMISTIC_ADD",
        productId: product.id,
        quantity,
        maxStock: product.stock,
      });

      if (options?.openDrawer) {
        dispatch({ type: "SET_DRAWER_OPEN", open: true });
      }

      try {
        const serverItems = await cartService.addItem(product.id, quantity);
        dispatch({ type: "SYNC_SUCCESS", items: serverItems });
        notify({
          tone: "success",
          title: "Added to bag",
          description: `${product.name} (${quantity}) is ready in your cart.`,
        });
      } catch {
        dispatch({ type: "ROLLBACK", previousItems: snapshot });
        notify({
          tone: "error",
          title: "Could not add item",
          description: "Your cart was restored to its previous state.",
        });
      }
    },
    [notify]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const snapshot = itemsRef.current;
      const product = productMap.get(productId);
      const maxStock = product?.stock ?? 20;

      dispatch({
        type: "OPTIMISTIC_UPDATE",
        productId,
        quantity,
        maxStock,
      });

      try {
        const serverItems = await cartService.updateQuantity(productId, quantity);
        dispatch({ type: "SYNC_SUCCESS", items: serverItems });
      } catch {
        dispatch({ type: "ROLLBACK", previousItems: snapshot });
        notify({
          tone: "error",
          title: "Update failed",
          description: "Unable to sync quantity. Changes were reverted.",
        });
      }
    },
    [notify, productMap]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const snapshot = itemsRef.current;
      const product = productMap.get(productId);
      dispatch({ type: "OPTIMISTIC_REMOVE", productId });

      try {
        const serverItems = await cartService.removeItem(productId);
        dispatch({ type: "SYNC_SUCCESS", items: serverItems });
        if (product) {
          notify({
            tone: "info",
            title: "Removed from bag",
            description: product.name,
          });
        }
      } catch {
        dispatch({ type: "ROLLBACK", previousItems: snapshot });
        notify({
          tone: "error",
          title: "Removal failed",
          description: "Unable to remove item right now.",
        });
      }
    },
    [notify, productMap]
  );

  const clearCart = useCallback(async () => {
    const snapshot = itemsRef.current;
    dispatch({ type: "OPTIMISTIC_CLEAR" });

    try {
      const serverItems = await cartService.clearCart();
      dispatch({ type: "SYNC_SUCCESS", items: serverItems });
    } catch {
      dispatch({ type: "ROLLBACK", previousItems: snapshot });
      notify({
        tone: "error",
        title: "Could not clear cart",
        description: "Please try again.",
      });
    }
  }, [notify]);

  const applyCoupon = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const coupon = resolveCoupon(rawCode);
      if (!coupon) {
        return {
          ok: false,
          message: "Invalid code. Try WELCOME10 (10% off) or FREESHIP.",
        };
      }
      dispatch({ type: "SET_COUPON", couponCode: coupon.code });
      notify({
        tone: "success",
        title: `Coupon ${coupon.code} applied`,
        description: coupon.description,
      });
      return { ok: true, message: coupon.description };
    },
    [notify]
  );

  const removeCoupon = useCallback(() => {
    dispatch({ type: "SET_COUPON", couponCode: null });
  }, []);

  const openDrawer = useCallback(() => {
    dispatch({ type: "SET_DRAWER_OPEN", open: true });
  }, []);

  const closeDrawer = useCallback(() => {
    dispatch({ type: "SET_DRAWER_OPEN", open: false });
  }, []);

  const hydratedItems = useMemo<HydratedCartItem[]>(() => {
    const list: HydratedCartItem[] = [];
    for (const item of state.items) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      list.push({
        product,
        quantity: item.quantity,
        lineTotalCents: product.priceCents * item.quantity,
      });
    }
    return list;
  }, [state.items, productMap]);

  const pricing = useMemo(
    () => calculatePricing(hydratedItems, state.couponCode),
    [hydratedItems, state.couponCode]
  );

  const stateValue = useMemo<CartStateContextValue>(
    () => ({
      items: state.items,
      hydratedItems,
      pricing,
      couponCode: state.couponCode,
      isHydrated: state.isHydrated,
      isSyncing: state.isSyncing,
      isDrawerOpen: state.isDrawerOpen,
    }),
    [state, hydratedItems, pricing]
  );

  const actionsValue = useMemo<CartActionsContextValue>(
    () => ({
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCart,
      applyCoupon,
      removeCoupon,
      openDrawer,
      closeDrawer,
    }),
    [
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCart,
      applyCoupon,
      removeCoupon,
      openDrawer,
      closeDrawer,
    ]
  );

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState(): CartStateContextValue {
  const ctx = useContext(CartStateContext);
  if (!ctx) {
    throw new Error("useCartState must be used within a CartProvider.");
  }
  return ctx;
}

export function useCartActions(): CartActionsContextValue {
  const ctx = useContext(CartActionsContext);
  if (!ctx) {
    throw new Error("useCartActions must be used within a CartProvider.");
  }
  return ctx;
}
