// RF01: bike form fields, shared by create and edit.
import { BIKE_TYPES } from "@/lib/forms";

type Bike = { name: string; type: string; brand: string | null; model: string | null; year: number | null };

export function BikeFields({ bike }: { bike?: Bike }) {
  return (
    <>
      <label>Nome <input name="name" required maxLength={60} defaultValue={bike?.name} placeholder="Ex.: MTB de trilha" /></label>
      <label>Tipo
        <select name="type" required defaultValue={bike?.type ?? "MTB"}>
          {Object.entries(BIKE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>Marca <input name="brand" maxLength={60} defaultValue={bike?.brand ?? ""} /></label>
      <label>Modelo <input name="model" maxLength={80} defaultValue={bike?.model ?? ""} /></label>
      <label>Ano <input name="year" type="number" min={1900} max={2100} defaultValue={bike?.year ?? ""} /></label>
    </>
  );
}
