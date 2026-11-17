import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSessionToken,
  getSessionSecret,
  SESSION_MAX_AGE_MS,
  verifySessionToken,
} from "./session";

describe("HMAC session token crypto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates and verifies a valid signed token", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken("usr_demo_01", now);
    const payload = verifySessionToken(token, now + 5_000);

    expect(payload).toEqual({ userId: "usr_demo_01", iat: now });
  });

  it("rejects a token with a tampered signature", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken("usr_demo_01", now);
    const [encoded, sig] = token.split(".");
    const tamperedSig = `${sig?.slice(0, -1)}${sig?.endsWith("a") ? "b" : "a"}`;

    expect(verifySessionToken(`${encoded}.${tamperedSig}`, now)).toBeNull();
  });

  it("rejects a token with a tampered payload", () => {
    const now = 1_700_000_000_000;
    const token = createSessionToken("usr_demo_01", now);
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ userId: "usr_admin_99", iat: now }),
      "utf8"
    ).toString("base64url");

    expect(verifySessionToken(`${forgedPayload}.${sig}`, now)).toBeNull();
  });

  it("rejects an expired token past SESSION_MAX_AGE_MS", () => {
    const issuedAt = 1_700_000_000_000;
    const token = createSessionToken("usr_demo_01", issuedAt);
    const afterExpiry = issuedAt + SESSION_MAX_AGE_MS + 1;

    expect(verifySessionToken(token, afterExpiry)).toBeNull();
  });

  it("throws in production when SESSION_SECRET is missing or too short", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");

    expect(() => getSessionSecret()).toThrow(/SESSION_SECRET/);

    vi.stubEnv("SESSION_SECRET", "short");
    expect(() => getSessionSecret()).toThrow(/SESSION_SECRET/);

    vi.stubEnv("SESSION_SECRET", "a-valid-production-secret-key-32chars");
    expect(getSessionSecret()).toBe("a-valid-production-secret-key-32chars");
  });
});
