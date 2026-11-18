// RF10, RF12: JSON helpers of the app's maintenance API.
import { describe, expect, it } from "vitest";
import { field, maintenanceResponse, readJson } from "@/lib/api-json";

describe("api-json", () => {
  it("reads an object body and ignores anything else", async () => {
    const post = (body: string) => new Request("http://x", { method: "POST", body });
    expect(await readJson(post('{"date":"2026-11-18"}'))).toEqual({ date: "2026-11-18" });
    expect(await readJson(post("[1]"))).toEqual({});
    expect(await readJson(post("not json"))).toEqual({});
  });

  it("trims and cuts string fields", () => {
    expect(field({ note: "  abc  " }, "note", 2)).toBe("ab");
    expect(field({ note: 5 }, "note", 10)).toBe("");
    expect(field({}, "note", 10)).toBe("");
  });

  it("maps results to HTTP statuses", async () => {
    expect((await maintenanceResponse({ ok: true, bikeId: "b", flash: "troca" }).json()).ok).toBe(true);
    expect(maintenanceResponse({ ok: false, error: "peca_nao_encontrada" }).status).toBe(404);
    expect(maintenanceResponse({ ok: false, error: "data", bikeId: "b" }).status).toBe(400);
  });
});
