import { api } from '@/lib/api';

export type Plan = { id: string; name: string; intervalKm: number | null; intervalHours: number | null; action: 'REPLACE' | 'SERVICE' };
export type CatalogComponent = { id: string; code: string | null; brand: string; model: string; active: boolean };
export type CatalogCategory = { id: string; name: string; active: boolean; wearsOnTrainer: boolean; plans: Plan[]; components: CatalogComponent[] };
export type ModelRequest = { id: string; kind: 'COMPONENT' | 'BIKE'; family: string | null; text: string; user: { name: string; email: string | null } };
export type AdminCatalog = {
  categories: CatalogCategory[];
  admins: { root: string[]; added: string[] };
  modelRequests: ModelRequest[];
};

const json = (body: unknown) => ({ body: JSON.stringify(body) });

/** RF30, RF31, RF37: admin catalog, admins and model requests (API /api/v1/admin/...). */
export const admin = {
  catalog: () => api<AdminCatalog>('/api/v1/admin/catalog'),
  createCategory: (b: { name: string; wearsOnTrainer?: boolean; plans?: { name: string; intervalKm?: number; intervalHours?: number; action?: 'REPLACE' | 'SERVICE' }[] }) =>
    api('/api/v1/admin/catalog/categories', { method: 'POST', ...json(b) }),
  updateCategory: (id: string, b: { name?: string; wearsOnTrainer?: boolean; active?: boolean }) =>
    api(`/api/v1/admin/catalog/categories/${id}`, { method: 'PATCH', ...json(b) }),
  addPlan: (categoryId: string, b: { name: string; intervalKm?: number; intervalHours?: number; action?: 'REPLACE' | 'SERVICE' }) =>
    api(`/api/v1/admin/catalog/categories/${categoryId}/plans`, { method: 'POST', ...json(b) }),
  deletePlan: (id: string) => api(`/api/v1/admin/catalog/plans/${id}`, { method: 'DELETE' }),
  createComponent: (b: { categoryId: string; brand: string; model: string; code?: string }) =>
    api('/api/v1/admin/catalog/components', { method: 'POST', ...json(b) }),
  toggleComponent: (id: string) => api(`/api/v1/admin/catalog/components/${id}/toggle`, { method: 'POST' }),
  addAdmin: (email: string) => api('/api/v1/admin/admins', { method: 'POST', ...json({ email }) }),
  removeAdmin: (email: string) => api(`/api/v1/admin/admins/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  answerRequest: (id: string, b: { status: 'REGISTERED' | 'REJECTED'; reply?: string }) =>
    api(`/api/v1/admin/model-requests/${id}`, { method: 'POST', ...json(b) }),
};
