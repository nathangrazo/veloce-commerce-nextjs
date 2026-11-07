import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-20">
          <div className="h-96 animate-pulse rounded-3xl bg-surface-subtle" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
