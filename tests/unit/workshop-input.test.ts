// RF25, #30, #69, #70: validation of the back-office bodies.
import { describe, expect, it } from "vitest";
import { parseHours, parseProfile, parseService } from "@/lib/workshop-input";

describe("parseProfile", () => {
  const ok = { name: " Bike  Shop ", description: "Revisão", address: "Rua A, 10", phone: "11 99999-0000", website: "https://bike.shop", latitude: -23.5, longitude: -46.6 };
  it("cleans and accepts a full profile", () => expect(parseProfile(ok)).toMatchObject({ name: "Bike Shop", website: "https://bike.shop", latitude: -23.5 }));
  it("coordinates are both or none", () => {
    expect(parseProfile({ ...ok, longitude: null })).toBeNull();
    expect(parseProfile({ name: "Bike Shop" })).toMatchObject({ latitude: null, longitude: null });
  });
  it("rejects bad name, site and coordinates", () => {
    expect(parseProfile({ ...ok, name: "A" })).toBeNull();
    expect(parseProfile({ ...ok, website: "javascript:alert(1)" })).toBeNull();
    expect(parseProfile({ ...ok, latitude: 95 })).toBeNull();
    expect(parseProfile(null)).toBeNull();
  });
});

describe("parseService", () => {
  const ok = { name: "Revisão completa", durationMin: 120, priceCents: 25000, includes: "Troca de corrente\n\nRegulagem" };
  it("accepts a service with duration and price", () => expect(parseService(ok)).toMatchObject({ durationMin: 120, priceCents: 25000, includes: "Troca de corrente\nRegulagem" }));
  it("price is optional", () => expect(parseService({ ...ok, priceCents: undefined })?.priceCents).toBeNull());
  it("duration is a multiple of 15 min between 15 min and 12 h", () => {
    expect(parseService({ ...ok, durationMin: 20 })).toBeNull();
    expect(parseService({ ...ok, durationMin: 0 })).toBeNull();
    expect(parseService({ ...ok, durationMin: 780 })).toBeNull();
    expect(parseService({ ...ok, durationMin: "60" })).toBeNull();
  });
  it("rejects a negative price and a missing name", () => {
    expect(parseService({ ...ok, priceCents: -1 })).toBeNull();
    expect(parseService({ ...ok, name: " " })).toBeNull();
  });
});

describe("parseHours", () => {
  it("sorts a valid grid", () => {
    expect(parseHours([{ weekday: 2, startMin: 600, endMin: 720 }, { weekday: 1, startMin: 540, endMin: 720 }])).toEqual([
      { weekday: 1, startMin: 540, endMin: 720 }, { weekday: 2, startMin: 600, endMin: 720 },
    ]);
  });
  it("accepts an empty grid and two windows in a day", () => {
    expect(parseHours([])).toEqual([]);
    expect(parseHours([{ weekday: 1, startMin: 540, endMin: 720 }, { weekday: 1, startMin: 840, endMin: 1080 }])).toHaveLength(2);
  });
  it("rejects overlaps, bad rows and non arrays", () => {
    expect(parseHours([{ weekday: 1, startMin: 540, endMin: 720 }, { weekday: 1, startMin: 690, endMin: 780 }])).toBeNull();
    expect(parseHours([{ weekday: 9, startMin: 540, endMin: 720 }])).toBeNull();
    expect(parseHours([{ weekday: 1, startMin: 545, endMin: 720 }])).toBeNull();
    expect(parseHours("x")).toBeNull();
  });
});

import { visitFormFromJson } from "@/lib/workshop-input";
import { readVisitItems, type VisitRow } from "@/lib/visit";

describe("visitFormFromJson (RF28, RF36)", () => {
  const rows: VisitRow[] = [{ key: "plan_abc1", partId: "p1", planId: "abc1", label: "Corrente" }];
  it("maps the JSON body to the web form fields that recordVisit reads", () => {
    const form = visitFormFromJson({
      date: "2026-11-18", note: "Revisão",
      items: [{ key: "plan_abc1", action: "reset", condition: "GOOD", note: "ok" }],
      free: [{ label: "Caixa de direção", action: "replace" }],
    })!;
    expect(form.get("date")).toBe("2026-11-18");
    const items = readVisitItems(form, rows);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ planId: "abc1", action: "reset", condition: "GOOD", note: "ok" });
    expect(items[1]).toMatchObject({ label: "Caixa de direção", action: "replace", partId: null });
  });
  it("rejects a bad date, bad keys and too many free items", () => {
    expect(visitFormFromJson({ date: "18/11/2026" })).toBeNull();
    expect(visitFormFromJson({ date: "2026-11-18", items: [{ key: "../x" }] })).toBeNull();
    expect(visitFormFromJson({ date: "2026-11-18", free: [{ label: "a" }, { label: "b" }, { label: "c" }, { label: "d" }] })).toBeNull();
    expect(visitFormFromJson(null)).toBeNull();
  });
});
