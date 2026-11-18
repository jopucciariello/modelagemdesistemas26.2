// RF31, RB15: pure reader of the part picker (componente → marca → modelo, with "outra marca" / "outro modelo").
import { text } from "@/lib/forms";

export type Picked = {
  categoryId: string;
  /** Catalog component, or null when the athlete typed the brand and model by hand. */
  componentId: string | null;
  manualBrand: string | null;
  manualModel: string | null;
  /** The athlete asked the admin to add the typed part to the catalog. */
  requestAdd: boolean;
};

export type PickerNames = { category: string; component: string };
export const FORM_NAMES: PickerNames = { category: "categoryId", component: "componentId" };

/** Null when no component is chosen or when a manual part misses its brand or model. */
export function readPicked(form: FormData, names: PickerNames = FORM_NAMES): Picked | null {
  const categoryId = text(form, names.category, 40);
  if (!categoryId) return null;
  const componentId = text(form, names.component, 40) || null;
  const manualBrand = text(form, "manualBrand", 60) || null;
  const manualModel = text(form, "manualModel", 80) || null;
  if (!componentId && !(manualBrand && manualModel)) return null;
  return { categoryId, componentId, manualBrand: componentId ? null : manualBrand, manualModel: componentId ? null : manualModel, requestAdd: !componentId && form.get("requestAdd") === "on" };
}

/** Text of a request to the admin for a part typed by hand. */
export function requestText(category: string, brand: string, model: string): string {
  return `${category}: ${brand} ${model}. Pedido feito ao cadastrar uma peça, anúncio ou sonho.`;
}
