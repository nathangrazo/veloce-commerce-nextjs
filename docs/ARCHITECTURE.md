# Architecture Notes

This document outlines the main structural decisions in **Veloce Commerce**, why they were made, and where the intentional shortcuts are.

## 1. Directory Boundaries

```text
src/
├── app/          # Thin Next.js App Router pages + REST Route Handlers
├── features/     # Domain-scoped client views (catalog, cart, checkout, auth, orders, settings)
├── contexts/     # Global client state via React Context API + useReducer
├── components/   # Generic UI controls (Button, Input, Badge, Toaster) + Navbar/Footer
├── domain/       # Pure TypeScript models, Zod schemas, and pricing rules
├── services/     # Typed HTTP client layer
├── server/       # Server-only code: catalog seed, HMAC session crypto, persistence drivers
└── lib/          # Shared helpers (Zod-validated localStorage, Intl formatting, cn)
```

Keeping `src/domain/pricing.ts` free of React and Node imports lets both the client cart preview and `POST /api/orders` call the exact same calculation logic.

---

## 2. React Context API Design

### Split State & Actions (`CartContext`)
Putting state and dispatch functions in one Context value forces every consumer to re-render whenever state changes. `CartProvider` separates them into `CartStateContext` and `CartActionsContext`.

Because `ProductCard` only reads `useCartActions()`, adding an item updates the navbar badge and drawer without re-rendering the rest of the catalog grid.

### Queued Optimistic Updates & Concurrency Safety
Early versions of optimistic carts often snapshot `items` before a `fetch()` and roll back to that snapshot in `catch`. That breaks under rapid user interaction: if request A fails after request B has already succeeded, A's rollback overwrites B's state with an outdated snapshot.

`CartProvider` avoids this in two steps:
1. All cart API calls run sequentially through a FIFO promise queue (`queueRef`), preventing out-of-order server writes.
2. Each optimistic dispatch increments a monotonic counter (`revisionRef`). A response only updates reducer state if its revision still matches the latest queued mutation. If a request fails while newer mutations are pending, it lets the newer mutation finish; if it was the last item in the queue, it fetches authoritative state via `GET /api/cart`.

### `useSyncExternalStore` for Client Storage
`ThemeContext` and `RecentlyViewedContext` read `localStorage` and `matchMedia` via `useSyncExternalStore` with explicit server snapshots (`"system"` and `"[]"`). This avoids hydration warnings and avoids calling `setState` inside `useEffect`.

---

## 3. Sessions, Validation, and Persistence

- **HMAC-Signed Cookies (`src/server/session.ts`)**: Sessions are stored in an HTTP-only cookie (`veloce_session`) containing a base64url JSON payload (`{ userId, iat }`) and an HMAC-SHA256 signature verified with `crypto.timingSafeEqual`. Tokens older than 7 days (`SESSION_MAX_AGE_MS`) are rejected on the server. When `NODE_ENV === "production"`, missing or short `SESSION_SECRET` values throw instead of falling back to a default key.
- **Guest Cart Merge (`POST /api/auth/login`)**: Unauthenticated visitors receive an anonymous HTTP-only `veloce_cart_id` cookie. When they sign in, any guest items are merged into `user:<id>` respecting stock limits, and the guest cart is cleared.
- **Authoritative Checkout (`POST /api/orders`)**: Validates shipping details with Zod, loads the user's server-side cart, looks up catalog prices on the server, recalculates discounts/shipping via `calculatePricing()`, saves the order, and clears the cart.
- **Reset Endpoint (`POST /api/demo/reset`)**: Requires a valid session cookie and only clears the signed-in user's own cart, orders, and profile defaults.
- **Storage Drivers (`src/server/store.ts`)**:
  - **Upstash Redis / Vercel KV REST (`UpstashRestDriver`)**: Activated automatically when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL` + `KV_REST_API_TOKEN`) are configured. Uses separate keys per cart/user and atomic `LPUSH` for orders so concurrent serverless invocations do not overwrite each other.
  - **Local JSON File (`LocalFileDriver`)**: Default for local development and unit tests, guarded by an in-process async mutex around read-modify-write operations.

---

## 4. Theme Flash Prevention

In `src/app/layout.tsx`, a small inline script reads `veloce:theme` from `localStorage` and sets `.dark` on `<html>` before first paint so dark-mode users do not see a white flash on hard reload.
