import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import * as sessionModule from "@/server/session";
import * as storeModule from "@/server/store";

describe("POST /api/demo/reset", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated callers with 401", async () => {
    vi.spyOn(sessionModule, "getSessionUserId").mockResolvedValue(null);
    const resetSpy = vi.spyOn(storeModule, "resetUserDemoData").mockResolvedValue();

    const response = await POST();

    expect(response.status).toBe(401);
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it("resets only the authenticated user's cart and order data", async () => {
    vi.spyOn(sessionModule, "getSessionUserId").mockResolvedValue("usr_demo_01");
    vi.spyOn(sessionModule, "getOrCreateCartKey").mockResolvedValue({
      cartKey: "user:usr_demo_01",
      isNew: false,
      guestCartId: null,
    });
    const resetSpy = vi.spyOn(storeModule, "resetUserDemoData").mockResolvedValue();

    const response = await POST();

    expect(response.status).toBe(200);
    expect(resetSpy).toHaveBeenCalledWith("usr_demo_01", "user:usr_demo_01");
  });
});
