import { api } from '@/lib/api';

// Back-office da oficina e fila do admin (RF25, RB21, RB17): /api/v1/oficinas/staff/* e /admin/*.
const BASE = '/api/v1/oficinas';

export type StaffService = {
  id: string;
  name: string;
  description: string | null;
  includes: string;
  durationMin: number;
  priceCents: number | null;
};

export type GridHour = { weekday: number; startMin: number; endMin: number };

export type StaffView =
  | { workshop: null; request: { status: 'PENDING' | 'ACTIVE' | 'REJECTED'; name: string } | null }
  | {
      workshop: {
        id: string;
        isOwner: boolean;
        name: string;
        description: string | null;
        address: string | null;
        phone: string | null;
        website: string | null;
        latitude: number | null;
        longitude: number | null;
        ownerEmail: string;
      };
      hours: GridHour[];
      services: StaffService[];
      members: { id: string; email: string }[];
      appointments: { id: string; startsAt: string; athlete: string; bike: string; service: string | null; shareHistory: boolean }[];
      notices: { id: string; message: string; urgent: boolean; createdAt: string }[];
    };

export type AdminRequest = {
  id: string;
  name: string;
  ownerEmail: string;
  contact: string | null;
  requestText: string | null;
  status: 'PENDING' | 'REJECTED';
};

const send = (method: string, path: string, body?: unknown) =>
  api<unknown>(`${BASE}${path}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

export const getMyWorkshop = () => api<StaffView>(`${BASE}/staff/workshop`);
export const requestWorkshop = (body: { name: string; contact: string; requestText: string }) => send('POST', '/staff/request', body);
export const saveProfile = (body: Record<string, unknown>) => send('PUT', '/staff/profile', body);
export const addService = (body: { name: string; durationMin: number; priceCents: number | null; includes: string }) => send('POST', '/staff/services', body);
export const removeService = (id: string) => send('DELETE', `/staff/services/${id}`);
export const saveHours = (hours: GridHour[]) => send('PUT', '/staff/hours', hours);
export const inviteMember = (email: string) => send('POST', '/staff/members', { email });
export const removeMember = (id: string) => send('DELETE', `/staff/members/${id}`);

export const listRequests = () => api<{ requests: AdminRequest[] }>(`${BASE}/admin/requests`).then((r) => r.requests);
export const decideRequest = (id: string, decision: 'approve' | 'reject') => send('POST', `/admin/requests/${id}/${decision}`);

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

/** "09:00" -> 540; null quando inválido. */
export function parseClock(raw: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function formatClock(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** "09:00-12:00, 14:00-18:00" -> janelas do dia; null quando inválido. Vazio = fechado. Passos de 30 min (RF25). */
export function parseDayWindows(raw: string, weekday: number): GridHour[] | null {
  if (!raw.trim()) return [];
  const rows: GridHour[] = [];
  for (const part of raw.split(',')) {
    const [a, b] = part.split('-');
    const startMin = a === undefined ? null : parseClock(a);
    const endMin = b === undefined ? null : parseClock(b);
    if (startMin === null || endMin === null || startMin >= endMin || startMin % 30 !== 0 || endMin % 30 !== 0) return null;
    rows.push({ weekday, startMin, endMin });
  }
  return rows;
}

export function formatDayWindows(hours: GridHour[], weekday: number): string {
  return hours
    .filter((h) => h.weekday === weekday)
    .map((h) => `${formatClock(h.startMin)}-${formatClock(h.endMin)}`)
    .join(', ');
}

/** "250" ou "250,50" em reais -> centavos; null quando vazio ou inválido. */
export function parsePriceCents(raw: string): number | null {
  const t = raw.trim().replace(/\./g, '').replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
