"use client";
// RF01, RF35, RF31: one form to add a bike: apelido, marca → modelo (or typed by hand), ano,
// data das peças e bike no Strava.
import { useMemo, useState } from "react";
import { BIKE_TYPES } from "@/lib/forms";

export type BikeModelOption = { id: string; brand: string; model: string; version: string | null };
const OTHER = "__other";

export function NewBikeForm({ action, models, sourceBikes, today }: {
  action: (form: FormData) => void | Promise<void>;
  models: BikeModelOption[];
  sourceBikes: { stravaGearId: string; name: string }[];
  today: string;
}) {
  const [brand, setBrand] = useState("");
  const [modelId, setModelId] = useState("");
  const [gear, setGear] = useState("");
  const brands = useMemo(() => Array.from(new Set(models.map((m) => m.brand))), [models]);
  const ofBrand = models.filter((m) => m.brand === brand);
  const manualBrand = brand === OTHER;
  const manual = manualBrand || modelId === OTHER;
  const catalogId = brand && modelId && !manual ? modelId : "";
  return (
    <form action={action} className="stack bike-form">
      <label>Apelido da bike <input name="name" required maxLength={60} placeholder="Ex.: Minha MTB de trilha" /></label>
      <div className="row">
        <label>Marca
          <select required value={brand} onChange={(e) => { setBrand(e.target.value); setModelId(""); }}>
            <option value="" disabled>Escolha…</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            <option value={OTHER}>Outra marca</option>
          </select>
        </label>
        {manualBrand ? (
          <label>Nome da marca <input name="brand" required maxLength={60} /></label>
        ) : (
          <label>Modelo
            <select required value={modelId} disabled={!brand} onChange={(e) => setModelId(e.target.value)}>
              <option value="" disabled>Escolha…</option>
              {ofBrand.map((m) => <option key={m.id} value={m.id}>{m.model}{m.version ? ` (${m.version})` : ""}</option>)}
              <option value={OTHER}>Outro modelo</option>
            </select>
          </label>
        )}
        {manual && <label>Nome do modelo <input name="model" required maxLength={80} /></label>}
        {manual && !manualBrand && <input type="hidden" name="brand" value={brand} />}
        {manual && (
          <label>Tipo
            <select name="type" required defaultValue="MTB">
              {Object.entries(BIKE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        )}
        <label>Ano do modelo <input name="year" type="number" min={1900} max={2100} placeholder="2024" /></label>
      </div>
      <input type="hidden" name="bikeModelId" value={catalogId} />
      {manual && <label className="check"><input type="checkbox" name="requestAdd" defaultChecked /> Pedir ao administrador que cadastre essa bike no catálogo</label>}
      <div className="row">
        <label>Peças instaladas em / data da aquisição <input name="installedAt" type="date" required max={today} defaultValue={today} /></label>
        {sourceBikes.length > 0 && (
          <label>Bike no Strava
            <select name="stravaGearId" value={gear} onChange={(e) => setGear(e.target.value)}>
              <option value="">(nenhuma)</option>
              {sourceBikes.map((s) => <option key={s.stravaGearId} value={s.stravaGearId}>{s.name}</option>)}
            </select>
          </label>
        )}
      </div>
      {gear && (
        <label className="check">
          <input type="checkbox" name="startAtFirstRide" /> Montada do zero: contar desde o primeiro pedal dessa bike no Strava (ignora a data acima)
        </label>
      )}
      <p className="muted">Depois de criar, você confere as peças e confirma ou troca cada uma.</p>
      <button className="button" type="submit" style={{ alignSelf: "flex-start" }}>Criar bike</button>
    </form>
  );
}
