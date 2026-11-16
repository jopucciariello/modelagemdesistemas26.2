// RF16, RF17, RB07: pure rules of the parts market (no DB, no UI).

export const MAX_PHOTOS = 3;

export type ListingInput = {
  title: string;
  categoryId: string;
  condition: "NEW" | "USED";
  priceCents: number | null;
  description?: string | null;
  photoUrls: string[];
  usedKm?: number | null;
};

export type ListingCheck = { ok: true } | { ok: false; error: string };

/** RF16: only http(s) URLs are accepted as photos. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** RF16, RB07: title required, price > 0, up to 3 http(s) photos, km only when used. */
export function validateListing(input: ListingInput): ListingCheck {
  if (!input.title.trim()) return { ok: false, error: "titulo_vazio" };
  if (!input.categoryId) return { ok: false, error: "familia_invalida" };
  if (input.condition !== "NEW" && input.condition !== "USED") return { ok: false, error: "condicao_invalida" };
  if (input.priceCents === null || !Number.isInteger(input.priceCents) || input.priceCents <= 0) return { ok: false, error: "preco_invalido" };
  if (input.photoUrls.length > MAX_PHOTOS) return { ok: false, error: "fotos_demais" };
  if (!input.photoUrls.every(isHttpUrl)) return { ok: false, error: "foto_invalida" };
  if (input.usedKm !== null && input.usedKm !== undefined) {
    if (input.condition !== "USED") return { ok: false, error: "km_so_usada" };
    if (!Number.isFinite(input.usedKm) || input.usedKm < 0) return { ok: false, error: "km_invalida" };
  }
  return { ok: true };
}

/** Parses "R$ 1.234,50", "1234,5" or "1234.50" into integer cents; null when invalid or not positive. */
export function parsePriceToCents(raw: string): number | null {
  const s = raw.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!s) return null;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

/** Formats cents as BRL, e.g. 123450 -> "R$ 1.234,50". */
export function formatBRL(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(cents));
  const reais = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}R$ ${reais},${String(abs % 100).padStart(2, "0")}`;
}

/** Photos are stored newline-separated (OPEN-31). */
export function splitPhotos(stored: string): string[] {
  return stored.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function joinPhotos(urls: string[]): string {
  return urls.join("\n");
}

export type MarketQuery = { categoria?: string; condicao?: string; min?: string; max?: string; vendedor?: string };

export type MarketWhere = {
  status: "ACTIVE";
  categoryId?: string;
  condition?: "NEW" | "USED";
  priceCents?: { gte?: number; lte?: number };
  seller?: { merchant: { isNot: null } | { is: null } };
};

/** RF17, INV-041: filter for the showcase; only ACTIVE listings. Invalid filter values are ignored. */
export function buildListingFilter(q: MarketQuery): MarketWhere {
  const where: MarketWhere = { status: "ACTIVE" };
  if (q.categoria) where.categoryId = q.categoria;
  if (q.condicao === "NEW" || q.condicao === "USED") where.condition = q.condicao;
  const min = q.min ? parsePriceToCents(q.min) : null;
  const max = q.max ? parsePriceToCents(q.max) : null;
  if (min !== null || max !== null) {
    where.priceCents = {};
    if (min !== null) where.priceCents.gte = min;
    if (max !== null) where.priceCents.lte = max;
  }
  if (q.vendedor === "loja") where.seller = { merchant: { isNot: null } };
  else if (q.vendedor === "atleta") where.seller = { merchant: { is: null } };
  return where;
}

export const ERROR_TEXT: Record<string, string> = {
  titulo_vazio: "Informe o título do anúncio.",
  familia_invalida: "Escolha uma família de peça existente.",
  condicao_invalida: "Escolha a condição: nova ou usada.",
  preco_invalido: "Informe um preço maior que zero, como R$ 1.234,50.",
  fotos_demais: "Use no máximo 3 fotos.",
  foto_invalida: "As fotos precisam ser links http ou https.",
  km_so_usada: "A km de uso só vale para peça usada.",
  km_invalida: "Informe a km de uso como um número válido.",
  anuncio_nao_encontrado: "Anúncio não encontrado ou não é seu.",
};
