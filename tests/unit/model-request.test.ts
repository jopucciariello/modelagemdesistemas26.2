// RF31, RB15, INV-032: validation of the help-menu request and of the admin answer.
import { describe, expect, it } from "vitest";
import { readAnswer, readModelRequest } from "@/lib/help";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("RF31: athlete request", () => {
  it("accepts a component request with an optional family", () => {
    expect(readModelRequest(form({ kind: "COMPONENT", family: " Corrente ", text: " Shimano CN-M8100 " }))).toEqual({ kind: "COMPONENT", family: "Corrente", text: "Shimano CN-M8100" });
    expect(readModelRequest(form({ kind: "BIKE", text: "Specialized Epic 8" }))?.family).toBeNull();
  });
  it("refuses empty text or an unknown kind", () => {
    expect(readModelRequest(form({ kind: "COMPONENT", text: "   " }))).toBeNull();
    expect(readModelRequest(form({ kind: "PART", text: "x" }))).toBeNull();
  });
});

describe("RF31: admin answer", () => {
  it("lets the admin register with or without a note", () => {
    expect(readAnswer(form({ status: "REGISTERED" }))).toEqual({ status: "REGISTERED", reply: null });
    expect(readAnswer(form({ status: "REGISTERED", reply: "Já está em Correntes" }))?.reply).toBe("Já está em Correntes");
  });
  it("requires a reason to refuse", () => {
    expect(readAnswer(form({ status: "REJECTED" }))).toBeNull();
    expect(readAnswer(form({ status: "REJECTED", reply: "Fora do escopo" }))).toEqual({ status: "REJECTED", reply: "Fora do escopo" });
  });
  it("never accepts OPEN as an answer", () => {
    expect(readAnswer(form({ status: "OPEN", reply: "x" }))).toBeNull();
  });
});
