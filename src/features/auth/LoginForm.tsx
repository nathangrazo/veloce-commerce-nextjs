"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { loginSchema } from "@/domain/schemas";
import { ApiError } from "@/services/http";

const DEMO_EMAIL = "demo@veloce.store";
const DEMO_PASS = "veloce123";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const { login } = useAuth();
  const { notify } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your credentials.");
      return;
    }

    setSubmitting(true);
    try {
      const authenticated = await login(parsed.data);
      notify({
        tone: "success",
        title: `Welcome back, ${authenticated.name.split(" ")[0]}`,
        description: "Your signed session cookie is active and your cart has been synced.",
      });
      router.push(nextPath.startsWith("/") ? nextPath : "/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign in right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError(null);
  }

  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Lock className="h-5 w-5" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Sign in to Veloce
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Access saved shipping details, guest-to-account cart merging, and order history.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-surface-subtle/70 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-highlight" />
              <span>Demo Account</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground border border-border hover:bg-background cursor-pointer"
            >
              <KeyRound className="h-3 w-3" />
              <span>Auto-fill</span>
            </button>
          </div>
          <div className="mt-2 space-y-0.5 font-mono text-xs text-muted">
            <p>Email: {DEMO_EMAIL}</p>
            <p>Password: {DEMO_PASS}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="demo@veloce.store"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger"
            >
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            <span>{submitting ? "Signing in..." : "Sign in"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
