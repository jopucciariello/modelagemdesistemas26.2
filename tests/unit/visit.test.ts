// RF36: shop visit with several items and their conditions.
import { describe, expect, it } from "vitest";
import { readVisitItems, visitItemNote, type VisitRow } from "@/lib/visit";

const rows: VisitRow[] = [
  { key: "plan_a", partId: "p1", planId: "a", label: "Suspensão: revisão completa" },
  { key: "plan_b", partId: "p2", planId: "b", label: "Pneu traseiro: troca" },
  { key: "part_c", partId: "p3", planId: null, label: "Selim" },
];

function form(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("RF36: readVisitItems", () => {
  it("records several items at once, each with its action and condition", () => {
    const items = readVisitItems(form({
      plan_a_act: "reset", plan_a_cond: "GOOD",
      plan_b_act: "replace",
      part_c_cond: "WATCH", part_c_note: "trilho riscado",
      free_0_label: "Movimento central", free_0_act: "check", free_0_cond: "REPLACE_SOON", free_0_note: "folga",
    }), rows);
    expect(items).toEqual([
      { partId: "p1", planId: "a", label: "Suspensão: revisão completa", action: "reset", condition: "GOOD", note: "" },
      { partId: "p2", planId: "b", label: "Pneu traseiro: troca", action: "replace", condition: null, note: "" },
      { partId: "p3", planId: null, label: "Selim", action: "check", condition: "WATCH", note: "trilho riscado" },
      { partId: null, planId: null, label: "Movimento central", action: "check", condition: "REPLACE_SOON", note: "folga" },
    ]);
  });
  it("ignores blank rows and unknown values", () => {
    expect(readVisitItems(form({ plan_a_act: "hack", plan_b_cond: "BAD" }), rows)).toEqual([]);
  });
  it("never resets a counter for a free item (it is not in the catalog)", () => {
    const [item] = readVisitItems(form({ free_1_label: "Caixa de direção", free_1_act: "reset" }), rows);
    expect(item.action).toBe("check");
  });
  it("writes the history line", () => {
    expect(visitItemNote({ label: "Movimento central", action: "check", note: "folga" }, "verificado")).toBe("Movimento central: verificado (folga)");
  });
});
