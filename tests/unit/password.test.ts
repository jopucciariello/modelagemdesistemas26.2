// RF04, RNF02: password hashing, validation and throttling.
import { describe, expect, it } from "vitest";
import {
  clearFailures, hashPassword, isThrottled, isValidPassword, isValidUsername, normalizeUsername, recordFailure, verifyPassword,
} from "@/lib/password";

describe("RNF02 password hash", () => {
  it("verifies the right password and rejects the wrong one; never stores plain text", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
  it("uses a fresh salt per hash", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });
  it("rejects malformed stored values", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("RF04 input rules", () => {
  it("validates usernames and passwords", () => {
    expect(isValidUsername(normalizeUsername(" João "))).toBe(false);
    expect(isValidUsername("joao.p-1")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
  });
  it("throttles after 5 failures and clears on success", () => {
    const k = "u:test";
    for (let i = 0; i < 5; i++) recordFailure(k, 1000);
    expect(isThrottled(k, 2000)).toBe(true);
    expect(isThrottled(k, 1000 + 16 * 60 * 1000)).toBe(false);
    clearFailures(k);
    expect(isThrottled(k, 2000)).toBe(false);
  });
});
