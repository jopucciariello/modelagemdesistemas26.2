// RF36: a shop visit records several items at once, each with what was done and its condition (pure).

export type VisitAction = "check" | "reset" | "replace";
export type Condition = "GOOD" | "WATCH" | "REPLACE_SOON";

export const CONDITION_LABEL: Record<Condition, string> = {
  GOOD: "Boa",
  WATCH: "Atenção",
  REPLACE_SOON: "Trocar em breve",
};

/** One row of the visit form: a plan of a part, a part without plans, or a free item. */
export type VisitRow = { key: string; partId: string | null; planId: string | null; label: string };

export type VisitItem = {
  partId: string | null;
  planId: string | null;
  label: string;
  action: VisitAction;
  condition: Condition | null;
  note: string;
};

export const FREE_ROWS = 3;

const ACTIONS = new Set<VisitAction>(["check", "reset", "replace"]);
const CONDITIONS = new Set<Condition>(["GOOD", "WATCH", "REPLACE_SOON"]);

type Form = { get(name: string): FormDataEntryValue | null };
const str = (form: Form, name: string, max: number) => {
  const v = form.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

/**
 * Reads the visit form. A row counts when it has an action or a condition; rows left blank are
 * ignored. Free rows (`free_<i>_label`) are items outside the catalog, such as the bottom bracket.
 */
export function readVisitItems(form: Form, rows: readonly VisitRow[]): VisitItem[] {
  const items: VisitItem[] = [];
  const read = (key: string) => {
    const act = str(form, `${key}_act`, 10) as VisitAction;
    const cond = str(form, `${key}_cond`, 20) as Condition;
    return {
      action: ACTIONS.has(act) ? act : null,
      condition: CONDITIONS.has(cond) ? cond : null,
      note: str(form, `${key}_note`, 200),
    };
  };
  for (const row of rows) {
    const r = read(row.key);
    if (!r.action && !r.condition) continue;
    items.push({ partId: row.partId, planId: row.planId, label: row.label, action: r.action ?? "check", condition: r.condition, note: r.note });
  }
  for (let i = 0; i < FREE_ROWS; i++) {
    const label = str(form, `free_${i}_label`, 80);
    if (!label) continue;
    const r = read(`free_${i}`);
    // A free item is not in the catalog: it is recorded, but there is no counter to reset.
    items.push({ partId: null, planId: null, label, action: r.action === "replace" ? "replace" : "check", condition: r.condition, note: r.note });
  }
  return items;
}

/** Text of the history line of one item. */
export function visitItemNote(item: Pick<VisitItem, "label" | "action" | "note">, verb: string): string {
  return `${item.label}: ${verb}${item.note ? ` (${item.note})` : ""}`;
}

type VisitPart = {
  id: string;
  position: string | null;
  component: { brand: string; model: string; category: { name: string } };
  plans: { id: string; name: string; action: "REPLACE" | "SERVICE" }[];
};

export type VisitRowView = VisitRow & { canReset: boolean; resetLabel: string };

/** Rows of the visit form: one per plan of each installed part, one per part without plans. */
export function visitRows(parts: readonly VisitPart[]): VisitRowView[] {
  const rows: VisitRowView[] = [];
  for (const part of parts) {
    const where = part.position ?? part.component.category.name;
    if (part.plans.length === 0) {
      rows.push({ key: `part_${part.id}`, partId: part.id, planId: null, label: where, canReset: false, resetLabel: "" });
      continue;
    }
    for (const plan of part.plans) {
      const canReset = plan.action === "SERVICE" || part.plans.length > 1; // RB13, RB18
      rows.push({
        key: `plan_${plan.id}`,
        partId: part.id,
        planId: plan.id,
        label: `${where}: ${plan.name}`,
        canReset,
        resetLabel: plan.action === "SERVICE" ? "Revisado (zera o plano)" : `Trocado: ${plan.name} (zera o item)`,
      });
    }
  }
  return rows;
}
