// RF31, RB15: reader of the part picker (componente → marca → modelo, manual entry and request to the admin).
import { describe, expect, it } from "vitest";
import { readPicked, requestText } from "@/lib/picker";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("RF31: part picker", () => {
  it("reads a catalog component and ignores typed names", () => {
    expect(readPicked(form({ categoryId: "c1", componentId: "k1", manualBrand: "X", manualModel: "Y", requestAdd: "on" })))
      .toEqual({ categoryId: "c1", componentId: "k1", manualBrand: null, manualModel: null, requestAdd: false });
  });
  it("reads a hand-typed part and the request to the admin", () => {
    expect(readPicked(form({ categoryId: "c1", componentId: "", manualBrand: " Acme ", manualModel: "Z1", requestAdd: "on" })))
      .toEqual({ categoryId: "c1", componentId: null, manualBrand: "Acme", manualModel: "Z1", requestAdd: true });
    expect(readPicked(form({ categoryId: "c1", manualBrand: "Acme", manualModel: "Z1" }))?.requestAdd).toBe(false);
  });
  it("refuses a missing component, brand or model", () => {
    expect(readPicked(form({ componentId: "k1" }))).toBeNull();
    expect(readPicked(form({ categoryId: "c1" }))).toBeNull();
    expect(readPicked(form({ categoryId: "c1", manualBrand: "Acme" }))).toBeNull();
  });
  it("writes the request text for the admin", () => {
    expect(requestText("Corrente", "Acme", "Z1")).toContain("Corrente: Acme Z1");
  });
});
