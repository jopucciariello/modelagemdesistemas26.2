// RF18, RF24, RB06: merchant helpers and the admin guard on every merchant action.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cleanRemovalReason, isValidEmail, normalizeEmail, verificationFields } from "@/lib/merchants";

describe("RF18: e-mail of the merchant", () => {
  it("normalizes case and spaces", () => {
    expect(normalizeEmail("  Loja@Example.COM ")).toBe("loja@example.com");
  });
  it("rejects malformed e-mails", () => {
    expect(isValidEmail("loja@example.com")).toBe(true);
    expect(isValidEmail("loja")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
  });
});

describe("RF24: removal reason", () => {
  it("is required", () => {
    expect(cleanRemovalReason("")).toBeNull();
    expect(cleanRemovalReason("   ")).toBeNull();
    expect(cleanRemovalReason("abc")).toBeNull();
  });
  it("is trimmed and collapsed", () => {
    expect(cleanRemovalReason("  Foto   falsa  ")).toBe("Foto falsa");
  });
  it("is capped at 300 characters", () => {
    expect(cleanRemovalReason("x".repeat(500))).toHaveLength(300);
  });
});

describe("RB06: seal", () => {
  const now = new Date("2026-11-16T12:00:00Z");
  it("stamps verifiedAt when granted", () => {
    expect(verificationFields(true, now)).toEqual({ verified: true, verifiedAt: now });
  });
  it("clears it when revoked (INV-049)", () => {
    expect(verificationFields(false, now)).toEqual({ verified: false, verifiedAt: null });
  });
});

describe("RB06, RB17: every merchant action starts with requireAdmin", () => {
  const src = readFileSync("src/app/actions/merchants.ts", "utf8");
  for (const name of ["createMerchant", "setVerified", "removeListing"]) {
    it(name, () => {
      const body = src.split(`export async function ${name}`)[1]?.split("export async function")[0] ?? "";
      expect(body.split("\n").slice(0, 3).join("\n")).toContain("await requireAdmin()");
    });
  }
});
