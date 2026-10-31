import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            VELOCE COMMERCE
          </p>
          <p className="mt-1 text-xs text-muted">
            Next.js App Router + React Context API architecture showcase with optimistic
            cart state, signed sessions, and Zod-validated API routes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            Catalog
          </Link>
          <Link href="/cart" className="hover:text-foreground transition-colors">
            Cart
          </Link>
          <Link href="/orders" className="hover:text-foreground transition-colors">
            Orders
          </Link>
          <Link href="/settings" className="hover:text-foreground transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
