import { api } from '@/lib/api';

export type Listing = {
  id: string; title: string; description: string | null; condition: 'NEW' | 'USED'; priceCents: number; usedKm: number | null;
  photos: string[]; status: string; category: { name: string }; component: { brand: string; model: string } | null;
  seller: { id: string; name: string; whatsapp: string | null };
  merchant: { name: string; verified: boolean; shopUrl: string | null } | null;
  contactUrl: string | null;
};
export type Component = { id: string; brand: string; model: string; category: { name: string } };
export type Dream = { id: string; maxPriceCents: number; component: Component | null };
export type Notice = { id: string; message: string; href: string | null; readAt: string | null; createdAt: string };

export const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const json = (body: unknown) => ({ body: JSON.stringify(body) });

export const market = {
  listings: (q: Record<string, string> = {}) => api<Listing[]>(`/api/v1/market/listings?${new URLSearchParams(q)}`),
  components: (q: string) => api<Component[]>(`/api/v1/catalog/components?${new URLSearchParams({ q })}`),
  publish: (b: { title: string; componentId: string; condition: 'NEW' | 'USED'; priceCents: number; description?: string; usedKm?: number }) =>
    api<{ id: string }>('/api/v1/market/listings', { method: 'POST', ...json({ ...b, photoUrls: [] }) }),
  uploadPhoto: (listingId: string, uri: string, mime: string) => {
    const form = new FormData();
    form.append('photo', { uri, name: 'foto', type: mime } as unknown as Blob);
    return api(`/api/v1/market/listings/${listingId}/photos`, { method: 'POST', body: form });
  },
  report: (id: string, reason: string) => api(`/api/v1/market/listings/${id}/report`, { method: 'POST', ...json({ reason }) }),
  dreams: () => api<Dream[]>('/api/v1/market/dreams'),
  addDream: (componentId: string, maxPriceCents: number) => api('/api/v1/market/dreams', { method: 'POST', ...json({ componentId, maxPriceCents }) }),
  removeDream: (id: string) => api(`/api/v1/market/dreams/${id}`, { method: 'DELETE' }),
  notices: () => api<Notice[]>('/api/v1/notifications'),
  readNotices: () => api('/api/v1/notifications/read', { method: 'POST' }),
  contact: () => api<{ whatsapp: string | null; emailAlerts: boolean }>('/api/v1/me/contact'),
  saveContact: (b: { whatsapp?: string; emailAlerts?: boolean }) => api('/api/v1/me/contact', { method: 'PUT', ...json(b) }),
  requestMerchant: (b: { storeName: string; message: string; contact: string; shopUrl?: string }) => api('/api/v1/merchant/request', { method: 'POST', ...json(b) }),
};
