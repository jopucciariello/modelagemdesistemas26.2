// RF16, RB07: listing form fields, shared by create and edit.
import { ComponentPicker, type PickerCategory } from "@/components/component-picker";
import { PhotoInput } from "@/components/photo-input";
import { formatBRL, MAX_PHOTOS, splitPhotos } from "@/lib/market";

type Listing = {
  title: string;
  categoryId: string;
  componentId?: string | null;
  condition: string;
  priceCents: number;
  description: string | null;
  usedKm: number | null;
  photoUrls: string;
  photos?: { id: string }[];
};

export function ListingFields({ categories, listing }: { categories: PickerCategory[]; listing?: Listing }) {
  return (
    <>
      <ComponentPicker categories={categories} defaultCategoryId={listing?.categoryId} defaultComponentId={listing?.componentId ?? ""} />
      <label>Título (opcional, por padrão usa marca e modelo) <input name="title" maxLength={120} defaultValue={listing?.title} placeholder="Ex.: Cassete Shimano 11-34, 11v" /></label>
      <label>Condição
        <select name="condition" required defaultValue={listing?.condition ?? "USED"}>
          <option value="NEW">Nova</option>
          <option value="USED">Usada</option>
        </select>
      </label>
      <label>Preço <input name="price" required inputMode="decimal" defaultValue={listing ? formatBRL(listing.priceCents) : ""} placeholder="R$ 350,00" /></label>
      <label>Km de uso (só se usada, informada por você) <input name="usedKm" inputMode="decimal" defaultValue={listing?.usedKm ?? ""} placeholder="Ex.: 1.200" /></label>
      <label>Descrição <textarea name="description" rows={3} maxLength={2000} defaultValue={listing?.description ?? ""} /></label>
      {listing?.photos && listing.photos.length > 0 && (
        <fieldset>
          <legend>Fotos enviadas (marque para remover)</legend>
          {listing.photos.map((p, i) => (
            <label key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/v1/market/photos/${p.id}`} alt={`Foto ${i + 1}`} width={72} height={72} style={{ objectFit: "cover" }} />
              <input type="checkbox" name="removePhoto" value={p.id} /> Remover
            </label>
          ))}
        </fieldset>
      )}
      <label>Fotos da sua peça (até {MAX_PHOTOS}, JPG, PNG ou WebP; reduzimos automaticamente)
        <PhotoInput max={MAX_PHOTOS} />
      </label>
      <label>Ou links de fotos (opcional, um por linha; no total, no máximo {MAX_PHOTOS} fotos)
        <textarea name="photos" rows={2} defaultValue={listing ? splitPhotos(listing.photoUrls).join("\n") : ""} placeholder="https://…" />
      </label>
    </>
  );
}
