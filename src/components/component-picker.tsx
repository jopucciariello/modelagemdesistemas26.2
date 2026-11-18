"use client";
// RF31, RB15: one menu for every part form: componente → marca → modelo. When the brand or the
// model is not in the catalog the athlete types it and may ask the admin to add it (RF31).
import { useMemo, useState } from "react";

type Item = { id: string; brand: string; model: string; modality?: string | null };
export type PickerCategory = { id: string; name: string; components: Item[] };

const OTHER = "__other";

export function ComponentPicker({
  categories,
  names = { category: "categoryId", component: "componentId" },
  defaultCategoryId = "",
  defaultComponentId = "",
  lockCategory = false,
  allowManual = true,
  askRequest = true,
}: {
  categories: PickerCategory[];
  names?: { category: string; component: string };
  defaultCategoryId?: string;
  defaultComponentId?: string;
  /** The component (category) is fixed, e.g. when replacing a part. */
  lockCategory?: boolean;
  allowManual?: boolean;
  askRequest?: boolean;
}) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const initial = categories.find((c) => c.id === defaultCategoryId)?.components.find((c) => c.id === defaultComponentId);
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [modelId, setModelId] = useState(initial?.id ?? "");
  const category = categories.find((c) => c.id === categoryId);
  const brands = useMemo(() => Array.from(new Set(category?.components.map((c) => c.brand) ?? [])), [category]);
  const models = category?.components.filter((c) => c.brand === brand) ?? [];
  const manualBrand = brand === OTHER;
  const manualModel = manualBrand || modelId === OTHER;
  const componentId = brand && modelId && !manualModel ? modelId : "";

  return (
    <>
      <label>Componente
        <select name={names.category} required value={categoryId} disabled={lockCategory} onChange={(e) => { setCategoryId(e.target.value); setBrand(""); setModelId(""); }}>
          <option value="" disabled>Escolha…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      {lockCategory && <input type="hidden" name={names.category} value={categoryId} />}
      <label>Marca
        <select required value={brand} disabled={!category} onChange={(e) => { setBrand(e.target.value); setModelId(""); }}>
          <option value="" disabled>Escolha…</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          {allowManual && <option value={OTHER}>Outra marca</option>}
        </select>
      </label>
      {manualBrand ? (
        <label>Nome da marca <input name="manualBrand" required maxLength={60} /></label>
      ) : (
        <>
          {manualModel && <input type="hidden" name="manualBrand" value={brand} />}
          <label>Modelo
            <select required value={modelId} disabled={!brand} onChange={(e) => setModelId(e.target.value)}>
              <option value="" disabled>Escolha…</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.model}{m.modality ? ` (${m.modality})` : ""}</option>)}
              {allowManual && <option value={OTHER}>Outro modelo</option>}
            </select>
          </label>
        </>
      )}
      {manualModel && <label>Nome do modelo <input name="manualModel" required maxLength={80} /></label>}
      <input type="hidden" name={names.component} value={componentId} />
      {manualModel && askRequest && (
        <label className="check">
          <input type="checkbox" name="requestAdd" defaultChecked /> Pedir ao administrador que cadastre essa peça no catálogo
        </label>
      )}
    </>
  );
}
