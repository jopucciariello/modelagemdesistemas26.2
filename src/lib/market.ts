// RF16, RF17, RB07: pure rules of the parts market (no DB, no UI). M3: contact, reports, dream-by-model.

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

// ---- M3 (17/11/2026): contact, dream-by-model, merchant request, reports --------------------

/** RF16: seller WhatsApp kept as digits with country code; Brazilian numbers without it get 55. Null when invalid. */
export function normalizeWhatsapp(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 12 && digits.length <= 15 ? digits : null;
}

/** RF16: wa.me link the buyer opens to talk to the seller (title in the pre-filled message). */
export function whatsappLink(whatsapp: string, title: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Vi seu anúncio no GearLog: ${title}`)}`;
}

/** RF18: request to become a merchant needs a store name, a message and a contact. */
export type MerchantRequestInput = { storeName: string; message: string; contact: string; shopUrl?: string | null };

export function validateMerchantRequest(input: MerchantRequestInput): ListingCheck {
  if (input.storeName.trim().length < 2) return { ok: false, error: "loja_sem_nome" };
  if (input.message.trim().length < 10) return { ok: false, error: "pedido_curto" };
  if (input.contact.trim().length < 5) return { ok: false, error: "contato_invalido" };
  if (input.shopUrl && !isHttpUrl(input.shopUrl)) return { ok: false, error: "loja_url_invalida" };
  return { ok: true };
}

/** RF24: a report needs a reason of at least 5 characters; at most 300. */
export function cleanReportReason(raw: string): string | null {
  const reason = raw.trim().replace(/\s+/g, " ").slice(0, 300);
  return reason.length >= 5 ? reason : null;
}

/** RF21 (17/11): a dream matches by catalog model (same component) and price <= max. Never the author. */
export type ModelDream = { userId: string; componentId: string | null; maxPriceCents: number };
export type ModelListing = { sellerId: string; componentId: string | null; priceCents: number; status: string };

export function matchesDreamByModel(dream: ModelDream, listing: ModelListing): boolean {
  if (listing.status !== "ACTIVE" || !dream.componentId || !listing.componentId) return false;
  if (dream.userId === listing.sellerId) return false;
  return dream.componentId === listing.componentId && listing.priceCents <= dream.maxPriceCents;
}

/** RF21: a edit only re-alerts when the match was not true before (new model or price dropped into range). */
export function becameMatch(dream: ModelDream, before: ModelListing, after: ModelListing): boolean {
  return !matchesDreamByModel(dream, before) && matchesDreamByModel(dream, after);
}

Object.assign(ERROR_TEXT, {
  loja_sem_nome: "Informe o nome da loja.",
  pedido_curto: "Conte em pelo menos 10 caracteres quem é a loja.",
  contato_invalido: "Informe um contato (telefone, e-mail ou Instagram).",
  loja_url_invalida: "O link da loja precisa ser http ou https.",
  whatsapp_invalido: "Informe o WhatsApp com DDD, por exemplo (11) 91234-5678.",
  motivo_invalido: "Explique a denúncia em pelo menos 5 caracteres.",
  anuncio_proprio: "Você não pode denunciar o próprio anúncio.",
});

// Admin catalog API (#65, RF30, RF31, RF37).
Object.assign(ERROR_TEXT, {
  categoria_invalida: "Informe o nome da família e planos válidos (nome e um intervalo).",
  categoria_existe: "Já existe uma família com esse nome.",
  categoria_nao_encontrado: "Família não encontrada.",
  plano_invalido: "O plano precisa de nome e de um intervalo em km ou horas.",
  componente_invalido: "Informe a família, a marca e o modelo.",
  componente_existe: "Esse componente já existe (mesma marca e modelo ou mesmo código).",
  componente_nao_encontrado: "Componente não encontrado.",
  admin_invalido: "Informe um e-mail válido.",
  admin_raiz: "Administradores raiz (Infisical) não podem ser removidos aqui.",
  admin_proprio: "Você não pode remover o seu próprio acesso.",
  resposta_invalida: "Para recusar, informe o motivo.",
  pedido_nao_encontrado: "Pedido não encontrado.",
});

Object.assign(ERROR_TEXT, { token_invalido: "Token de notificação inválido." });
