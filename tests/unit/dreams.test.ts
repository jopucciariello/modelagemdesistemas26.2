// RF21, RF22, INV-044, INV-046: dream x listing compatibility (pure function).
import { describe, expect, it } from "vitest";
import { matchesDream, normalize } from "@/lib/dreams";

const dream = { userId: "u1", categoryId: "tire", keywords: "700x28 Tubeless", maxPriceCents: 20000 };
const listing = { sellerId: "u2", categoryId: "tire", title: "Pneu 700x28 tubeless seminovo", priceCents: 18000, status: "ACTIVE" };

describe("matchesDream (RF21)", () => {
  it("matches a cheaper active listing of the same family", () => {
    expect(matchesDream(dream, listing)).toBe(true);
  });
  it("accepts the exact maximum price and rejects one cent above", () => {
    expect(matchesDream(dream, { ...listing, priceCents: 20000 })).toBe(true);
    expect(matchesDream(dream, { ...listing, priceCents: 20001 })).toBe(false);
  });
  it("requires the same family", () => {
    expect(matchesDream(dream, { ...listing, categoryId: "chain" })).toBe(false);
  });
  it("requires every keyword in the title", () => {
    expect(matchesDream(dream, { ...listing, title: "Pneu 700x28 usado" })).toBe(false);
    expect(matchesDream({ ...dream, keywords: null }, { ...listing, title: "Qualquer coisa" })).toBe(true);
    expect(matchesDream({ ...dream, keywords: "  " }, listing)).toBe(true);
  });
  it("ignores accents and case, with comma or space separators", () => {
    expect(matchesDream({ ...dream, keywords: "CÂMARA, pneu" }, { ...listing, title: "pneu e camara de ar" })).toBe(true);
    expect(normalize("  Câmara   DE Ar ")).toBe("camara de ar");
  });
  it("only matches ACTIVE listings", () => {
    expect(matchesDream(dream, { ...listing, status: "SOLD" })).toBe(false);
    expect(matchesDream(dream, { ...listing, status: "REMOVED" })).toBe(false);
  });
  it("never matches the author's own listing (INV-046)", () => {
    expect(matchesDream(dream, { ...listing, sellerId: "u1" })).toBe(false);
  });
});
