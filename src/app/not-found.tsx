import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-muted">
        The product or route you requested could not be found in our catalog.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Store</span>
      </Link>
    </div>
  );
}
