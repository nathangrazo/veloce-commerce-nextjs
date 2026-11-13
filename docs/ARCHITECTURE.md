# Architecture & Engineering Decisions

This document captures the architectural patterns and trade-offs behind **Veloce Commerce**, designed to demonstrate maintainable, production-grade React & Next.js engineering.

## 1. Layered Feature Architecture

```
src/
├── app/          # Thin Next.js App Router pages (Server Components) + REST Route Handlers
├── features/     # Domain-aligned UI modules (catalog, cart, checkout, auth, orders, settings)
├── contexts/     # Global client state via React Context API + useReducer
├── components/   # Reusable design-system primitives & layout shell
├── domain/       # Pure TypeScript models, Zod validation schemas, and pricing rules
├── services/     # Typed HTTP client layer decoupling React from fetch details
├── server/       # Server-only persistence repository, catalog seed, and HMAC session crypto
└── lib/          # Shared SSR-safe utilities (storage, currency formatting, class merging)
```

**Why this separation?**
- **Pure domain rules (`src/domain/pricing.ts`)** are shared verbatim between the client cart preview and the `POST /api/orders` handler, guaranteeing zero pricing drift and making business logic trivially unit-testable without DOM or network mocks.
- **Route files (`src/app/**/page.tsx`)** stay thin, focusing on SEO metadata, `generateStaticParams`, and server-side data loading.

---

## 2. Scalable React Context API Patterns

A naive single global Context causes every consumer in the tree to re-render on any state change. Veloce solves this through four deliberate patterns:

### A. Split State & Dispatch Contexts (`CartContext`)
`CartProvider` exposes two separate contexts:
- `CartStateContext` — read-only cart items, derived `PricingBreakdown`, and drawer state.
- `CartActionsContext` — stable `useCallback` mutations (`addItem`, `updateQuantity`, `removeItem`, `applyCoupon`, etc.).

Components like `ProductCard` subscribe **only** to `useCartActions()`. Adding an item to the cart updates the navbar badge and drawer without re-rendering every product card in the catalog grid.

### B. Deterministic `useReducer` + Optimistic Updates with Rollback
All cart mutations flow through a pure `cartReducer`:
1. Snapshot current `items` via a ref (preventing action callback identity churn).
2. Dispatch `OPTIMISTIC_*` immediately for instant UI responsiveness.
3. Persist asynchronously via `/api/cart`.
4. Reconcile with authoritative server response (`SYNC_SUCCESS`), or dispatch `ROLLBACK` + error toast on failure.

### C. Explicit Provider Composition (`AppProviders`)
Providers are ordered strictly by dependency flow:
`ThemeProvider → ToastProvider → AuthProvider → CartProvider → RecentlyViewedProvider`.

### D. Fail-Fast Custom Hooks
Every context exports a strict hook (`useCartState`, `useCartActions`, `useAuth`, `useTheme`, `useRecentlyViewed`, `useToast`) that throws a descriptive error if invoked outside its provider boundary.

---

## 3. Full-Stack Persistence & Security Awareness

- **Signed HTTP-Only Cookies (`src/server/session.ts`)**: Authentication sessions are signed using Node's `crypto.createHmac("sha256")` and verified via constant-time comparison (`crypto.timingSafeEqual`). Sensitive tokens are never placed in `localStorage`.
- **Guest-to-User Cart Merging**: Guest sessions track carts via an anonymous HTTP-only cookie (`veloce_cart_id`). Signing in merges guest cart items into the authenticated user's cart automatically.
- **Server-Authoritative Checkout (`POST /api/orders`)**: The client submits only shipping details, payment method, and optional coupon code. The server loads cart items, looks up authoritative catalog prices, validates stock caps, and computes the final total using `calculatePricing()`.
- **Zero-Config Persistence (`src/server/store.ts`)**: Persists to `data/store.json` with serialized async writes during local development, while gracefully falling back to in-memory storage on read-only serverless runtimes (such as Vercel).

---

## 4. Zero-FOUC Theme Engine

`ThemeContext` supports `light`, `dark`, and `system` modes persisted in `localStorage` (validated with Zod on read). A small synchronous inline script in `src/app/layout.tsx` applies `.dark` to `<html>` before first paint so page refreshes never flicker between themes.
