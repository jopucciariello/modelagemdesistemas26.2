// RF16, RB07: listing form fields, shared by create and edit.
import { formatBRL, splitPhotos } from "@/lib/market";

type Listing = {
  title: string;
  categoryId: string;
  condition: string;
  priceCents: number;
  description: string | null;
  usedKm: number | null;
  photoUrls: string;
};

export function ListingFields({ categories, listing }: { categories: { id: string; name: string }[]; listing?: Listing }) {
  return (
    <>
      <label>Título <input name="title" required maxLength={120} defaultValue={listing?.title} placeholder="Ex.: Cassete Shimano 11-34, 11v" /></label>
      <label>Família da peça
        <select name="categoryId" required defaultValue={listing?.categoryId ?? ""}>
          <option value="" disabled>Escolha…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Condição
        <select name="condition" required defaultValue={listing?.condition ?? "USED"}>
          <option value="NEW">Nova</option>
          <option value="USED">Usada</option>
        </select>
      </label>
      <label>Preço <input name="price" required inputMode="decimal" defaultValue={listing ? formatBRL(listing.priceCents) : ""} placeholder="R$ 350,00" /></label>
      <label>Km de uso (só se usada, informada por você) <input name="usedKm" inputMode="decimal" defaultValue={listing?.usedKm ?? ""} placeholder="Ex.: 1.200" /></label>
      <label>Descrição <textarea name="description" rows={3} maxLength={2000} defaultValue={listing?.description ?? ""} /></label>
      <label>Fotos (até 3 links http ou https, um por linha)
        <textarea name="photos" rows={3} defaultValue={listing ? splitPhotos(listing.photoUrls).join("\n") : ""} placeholder="https://…" />
      </label>
    </>
  );
}
