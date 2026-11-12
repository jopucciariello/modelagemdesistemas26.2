// RNF01: Strava tokens are encrypted at rest.
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, sha256 } from "@/lib/crypto";

const key = randomBytes(32).toString("base64");

describe("RNF01 token encryption", () => {
  it("round-trips a token", () => {
    const payload = encrypt("access-token-123", key);
    expect(payload).not.toContain("access-token-123");
    expect(decrypt(payload, key)).toBe("access-token-123");
  });

  it("uses a fresh IV each time", () => {
    expect(encrypt("same", key)).not.toBe(encrypt("same", key));
  });

  it("rejects a tampered payload", () => {
    const [iv, tag, data] = encrypt("secret", key).split(".");
    const tampered = [iv, tag, Buffer.from("other").toString("base64url") + data].join(".");
    expect(() => decrypt(tampered, key)).toThrow();
  });

  it("rejects a wrong key", () => {
    const payload = encrypt("secret", key);
    expect(() => decrypt(payload, randomBytes(32).toString("base64"))).toThrow();
  });

  it("rejects keys that are not 32 bytes", () => {
    expect(() => encrypt("x", randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
  });

  it("hashes session tokens deterministically", () => {
    expect(sha256("abc")).toBe(sha256("abc"));
    expect(sha256("abc")).toHaveLength(64);
  });
});
