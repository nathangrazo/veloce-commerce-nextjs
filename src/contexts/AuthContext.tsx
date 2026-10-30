"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginInput, UpdateProfileInput } from "@/domain/schemas";
import type { UserProfile } from "@/domain/types";
import { authService } from "@/services/auth.service";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: UserProfile | null;
  status: AuthStatus;
  login: (credentials: LoginInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<UserProfile>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshSession = useCallback(async () => {
    try {
      const current = await authService.getSession();
      setUser(current);
      setStatus(current ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    authService
      .getSession()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setStatus(current ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginInput) => {
    const authenticatedUser = await authService.login(credentials);
    setUser(authenticatedUser);
    setStatus("authenticated");
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const updated = await authService.updateProfile(input);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      updateProfile,
      refreshSession,
    }),
    [user, status, login, logout, updateProfile, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
