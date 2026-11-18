// RF30, RF31, RB16, #65: validation of the admin catalog API (no database).
import { describe, expect, it } from "vitest";
import { parseAnswerBody, parseCategoryBody, parseComponentBody, parsePlan } from "@/lib/api/admin-catalog";

describe("parsePlan", () => {
  it("needs a name and one interval; defaults to REPLACE", () => {
    expect(parsePlan({ name: "Corrente", intervalKm: 3000 })).toMatchObject({ action: "REPLACE", intervalKm: 3000, intervalHours: null });
    expect(parsePlan({ name: "Revisão", intervalHours: "100", action: "SERVICE", warnHours: 80 })).toMatchObject({ action: "SERVICE", intervalHours: 100, warnHours: 80 });
    expect(parsePlan({ name: "x" })).toBeNull();
    expect(parsePlan({ intervalKm: 5 })).toBeNull();
    expect(parsePlan({ name: "x", intervalKm: 0 })).toBeNull();
  });
});

describe("parseCategoryBody", () => {
  it("accepts a category without plans (RB16)", () => {
    expect(parseCategoryBody({ name: " Selins " })).toEqual({ name: "Selins", wearsOnTrainer: false, plans: [] });
  });
  it("rejects a missing name or an invalid plan", () => {
    expect(parseCategoryBody({ name: "" })).toBeNull();
    expect(parseCategoryBody({ name: "Pneus", plans: [{ name: "sem intervalo" }] })).toBeNull();
    expect(parseCategoryBody(null)).toBeNull();
  });
});

describe("parseComponentBody", () => {
  it("upper-cases the code and keeps optional fields null", () => {
    expect(parseComponentBody({ categoryId: "c1", brand: "Shimano", model: "CN-M8100", code: "trx-018", priceMin: "1.200,50" }))
      .toMatchObject({ code: "TRX-018", priceMin: 1200.5, priceMax: null, plans: [] });
  });
  it("needs category, brand and model (RB15)", () => {
    expect(parseComponentBody({ brand: "a", model: "b" })).toBeNull();
    expect(parseComponentBody({ categoryId: "c", brand: "a" })).toBeNull();
  });
});

describe("parseAnswerBody", () => {
  it("rejection needs a reason; registration does not", () => {
    expect(parseAnswerBody({ status: "REGISTERED" })).toEqual({ status: "REGISTERED", reply: null });
    expect(parseAnswerBody({ status: "REJECTED" })).toBeNull();
    expect(parseAnswerBody({ status: "REJECTED", reply: "já existe" })).toEqual({ status: "REJECTED", reply: "já existe" });
  });
});
