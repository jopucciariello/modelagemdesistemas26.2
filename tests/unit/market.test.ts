// RF16, RF17, RB07: listing validation, price handling and showcase filters, without DB or UI (RNF08).
import { describe, expect, it } from "vitest";
import { checkNewPhotos, buildListingFilter, formatBRL, parsePriceToCents, splitPhotos, validateListing, type ListingInput } from "@/lib/market";

const valid = (over: Partial<ListingInput> = {}): ListingInput => ({
  title: "Cassete 11-34",
  categoryId: "cat1",
  condition: "USED",
  priceCents: 35000,
  photoUrls: [],
  usedKm: null,
  ...over,
});

describe("RF16: listing validation", () => {
  it("accepts a valid listing", () => expect(validateListing(valid())).toEqual({ ok: true }));
  it("refuses an empty title", () => expect(validateListing(valid({ title: "  " }))).toEqual({ ok: false, error: "titulo_vazio" }));
  it("refuses a price of zero or less, or missing", () => {
    expect(validateListing(valid({ priceCents: 0 }))).toEqual({ ok: false, error: "preco_invalido" });
    expect(validateListing(valid({ priceCents: -5 }))).toEqual({ ok: false, error: "preco_invalido" });
    expect(validateListing(valid({ priceCents: null }))).toEqual({ ok: false, error: "preco_invalido" });
  });
  it("accepts up to 3 http(s) photos and refuses 4", () => {
    const u = "https://exemplo.com/a.jpg";
    expect(validateListing(valid({ photoUrls: [u, u, "http://x.com/b.png"] })).ok).toBe(true);
    expect(validateListing(valid({ photoUrls: [u, u, u, u] }))).toEqual({ ok: false, error: "fotos_demais" });
  });
  it("refuses non-http photo URLs", () => {
    expect(validateListing(valid({ photoUrls: ["javascript:alert(1)"] }))).toEqual({ ok: false, error: "foto_invalida" });
    expect(validateListing(valid({ photoUrls: ["nao é url"] }))).toEqual({ ok: false, error: "foto_invalida" });
  });
});

describe("RB07: km of use only for used parts, typed by the seller", () => {
  it("accepts km on a used part", () => expect(validateListing(valid({ usedKm: 1200 })).ok).toBe(true));
  it("refuses km on a new part", () => expect(validateListing(valid({ condition: "NEW", usedKm: 10 }))).toEqual({ ok: false, error: "km_so_usada" }));
  it("refuses negative km", () => expect(validateListing(valid({ usedKm: -1 }))).toEqual({ ok: false, error: "km_invalida" }));
});

describe("RF16: price in cents (ADR-008)", () => {
  it("parses Brazilian formats", () => {
    expect(parsePriceToCents("R$ 1.234,50")).toBe(123450);
    expect(parsePriceToCents("350")).toBe(35000);
    expect(parsePriceToCents("1234,5")).toBe(123450);
    expect(parsePriceToCents("1234.50")).toBe(123450);
    expect(parsePriceToCents("1.234")).toBe(123400);
  });
  it("rejects invalid or non-positive prices", () => {
    for (const s of ["", "abc", "0", "R$ 0,00", "-10", "1,234,5"]) expect(parsePriceToCents(s)).toBeNull();
  });
  it("formats BRL", () => {
    expect(formatBRL(123450)).toBe("R$ 1.234,50");
    expect(formatBRL(5)).toBe("R$ 0,05");
    expect(formatBRL(100000000)).toBe("R$ 1.000.000,00");
  });
  it("splits stored photos", () => expect(splitPhotos("a\n\n b \n")).toEqual(["a", "b"]));
});

describe("RF17: showcase filter", () => {
  it("always restricts to ACTIVE (INV-041)", () => expect(buildListingFilter({})).toEqual({ status: "ACTIVE" }));
  it("combines family, condition and price range in cents", () => {
    expect(buildListingFilter({ categoria: "c1", condicao: "USED", min: "100", max: "R$ 250,50" })).toEqual({
      status: "ACTIVE",
      categoryId: "c1",
      condition: "USED",
      priceCents: { gte: 10000, lte: 25050 },
    });
  });
  it("ignores invalid condition and prices", () => {
    expect(buildListingFilter({ condicao: "BROKEN", min: "x", max: "" })).toEqual({ status: "ACTIVE" });
  });
  it("filters by seller type (store has a Merchant)", () => {
    expect(buildListingFilter({ vendedor: "loja" }).seller).toEqual({ merchant: { isNot: null } });
    expect(buildListingFilter({ vendedor: "atleta" }).seller).toEqual({ merchant: { is: null } });
    expect(buildListingFilter({ vendedor: "outro" }).seller).toBeUndefined();
  });
});

describe("RF16: seller photo uploads", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
  it("accepts up to 3 valid images in total", () => {
    expect(checkNewPhotos(0, [png, png, png]).ok).toBe(true);
    expect(checkNewPhotos(1, [png, png]).ok).toBe(true);
  });
  it("refuses more than 3 photos counting the kept ones", () => {
    expect(checkNewPhotos(2, [png, png])).toEqual({ ok: false, error: "fotos_demais" });
  });
  it("refuses files that are not images or are too large", () => {
    expect(checkNewPhotos(0, [new Uint8Array([1, 2, 3])])).toEqual({ ok: false, error: "foto_tipo" });
    expect(checkNewPhotos(0, [new Uint8Array(1_000_001)])).toEqual({ ok: false, error: "foto_grande" });
  });
});
