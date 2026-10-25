import type { LoginInput, UpdateProfileInput } from "@/domain/schemas";
import type { UserProfile } from "@/domain/types";
import { apiFetch } from "./http";

export const authService = {
  async getSession(): Promise<UserProfile | null> {
    const data = await apiFetch<{ user: UserProfile | null }>("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });
    return data.user;
  },

  async login(credentials: LoginInput): Promise<UserProfile> {
    const data = await apiFetch<{ user: UserProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await apiFetch<{ ok: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  },

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const data = await apiFetch<{ user: UserProfile }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return data.user;
  },
};
