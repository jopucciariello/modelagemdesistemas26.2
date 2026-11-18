// RF16, RF18, RF21, RF24 (decisions of 17/11/2026): WhatsApp contact, merchant request, dream by model, reports.
import { describe, expect, it } from "vitest";
import { becameMatch, cleanReportReason, matchesDreamByModel, normalizeWhatsapp, validateMerchantRequest, whatsappLink } from "@/lib/market";

describe("normalizeWhatsapp (RF16)", () => {
  it("adds 55 to Brazilian numbers and strips punctuation", () => {
    expect(normalizeWhatsapp("(11) 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsapp("+55 11 91234-5678")).toBe("5511912345678");
  });
  it("rejects short or too long numbers", () => {
    expect(normalizeWhatsapp("1234")).toBeNull();
    expect(normalizeWhatsapp("1".repeat(16))).toBeNull();
  });
  it("builds a wa.me link with the encoded title", () => {
    expect(whatsappLink("5511912345678", "Pneu 700x28")).toBe("https://wa.me/5511912345678?text=" + encodeURIComponent("Olá! Vi seu anúncio no GearLog: Pneu 700x28"));
  });
});

describe("validateMerchantRequest (RF18)", () => {
  const ok = { storeName: "Bike Shop", message: "Loja física em Campinas há 5 anos", contact: "@bikeshop" };
  it("accepts a complete request", () => expect(validateMerchantRequest(ok)).toEqual({ ok: true }));
  it("requires name, message, contact and a valid shop url", () => {
    expect(validateMerchantRequest({ ...ok, storeName: "" })).toEqual({ ok: false, error: "loja_sem_nome" });
    expect(validateMerchantRequest({ ...ok, message: "curto" })).toEqual({ ok: false, error: "pedido_curto" });
    expect(validateMerchantRequest({ ...ok, contact: "1" })).toEqual({ ok: false, error: "contato_invalido" });
    expect(validateMerchantRequest({ ...ok, shopUrl: "ftp://x" })).toEqual({ ok: false, error: "loja_url_invalida" });
    expect(validateMerchantRequest({ ...ok, shopUrl: "https://loja.com" })).toEqual({ ok: true });
  });
});

describe("matchesDreamByModel (RF21)", () => {
  const dream = { userId: "u1", componentId: "c1", maxPriceCents: 20000 };
  const listing = { sellerId: "u2", componentId: "c1", priceCents: 18000, status: "ACTIVE" };
  it("matches same model at or under the max price", () => {
    expect(matchesDreamByModel(dream, listing)).toBe(true);
    expect(matchesDreamByModel(dream, { ...listing, priceCents: 20000 })).toBe(true);
    expect(matchesDreamByModel(dream, { ...listing, priceCents: 20001 })).toBe(false);
  });
  it("rejects other models, missing models, inactive listings and the author", () => {
    expect(matchesDreamByModel(dream, { ...listing, componentId: "c2" })).toBe(false);
    expect(matchesDreamByModel(dream, { ...listing, componentId: null })).toBe(false);
    expect(matchesDreamByModel({ ...dream, componentId: null }, listing)).toBe(false);
    expect(matchesDreamByModel(dream, { ...listing, status: "SOLD" })).toBe(false);
    expect(matchesDreamByModel(dream, { ...listing, sellerId: "u1" })).toBe(false);
  });
  it("becameMatch fires only on the transition", () => {
    expect(becameMatch(dream, { ...listing, priceCents: 25000 }, listing)).toBe(true);
    expect(becameMatch(dream, listing, { ...listing, priceCents: 17000 })).toBe(false);
  });
});

describe("cleanReportReason (RF24)", () => {
  it("needs 5+ characters and trims", () => {
    expect(cleanReportReason("  golpe  ")).toBe("golpe");
    expect(cleanReportReason("abc")).toBeNull();
  });
});
