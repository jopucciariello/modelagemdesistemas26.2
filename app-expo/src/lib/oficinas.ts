import * as Location from 'expo-location';

import { api } from '@/lib/api';

// Rotas da API de oficinas (#71, RF25–RF29): /api/v1/oficinas/*.
const BASE = '/api/v1/oficinas';

export type Service = {
  id: string;
  name: string;
  description: string | null;
  includes: string;
  durationMin: number;
  priceCents: number | null;
};

export type Workshop = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  services: Service[];
};

export type Appointment = {
  id: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  startsAt: string;
  endsAt: string | null;
  shareHistory: boolean;
  workshop: { id: string; name: string; phone: string | null };
  service: { name: string; durationMin: number } | null;
  bike: string;
};

export type Origin = { latitude: number; longitude: number };

export const listWorkshops = (origin: Origin | null) =>
  api<{ workshops: Workshop[] }>(
    `${BASE}/workshops${origin ? `?lat=${origin.latitude}&lng=${origin.longitude}` : ''}`,
  ).then((r) => r.workshops);

export const listSlots = (workshopId: string, serviceId: string) =>
  api<{ starts: string[] }>(`${BASE}/workshops/${workshopId}/slots?serviceId=${serviceId}`).then((r) => r.starts);

export const listMyBikes = () => api<{ bikes: { id: string; name: string }[] }>(`${BASE}/my-bikes`).then((r) => r.bikes);

export const listAppointments = () => api<{ appointments: Appointment[] }>(`${BASE}/appointments`).then((r) => r.appointments);

export const book = (body: { workshopId: string; serviceId: string; bikeId: string; startsAt: string; shareHistory: boolean }) =>
  api<{ appointmentId: string }>(`${BASE}/appointments`, { method: 'POST', body: JSON.stringify(body) });

export const cancelAppointment = (id: string) =>
  api<{ ok: true; late: boolean }>(`${BASE}/appointments/${id}/cancel`, { method: 'POST' });

/** R$ 120,00 a partir de centavos; "Valor a combinar" quando a oficina não informou. */
export function formatPrice(cents: number | null): string {
  if (cents == null) return 'Valor a combinar';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

/** "sex., 20/11 14:30" no horário de São Paulo. */
export function formatStart(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Mapa simples do OpenStreetMap (#69); o Google Maps fica como evolução. */
export function osmUrl(w: Pick<Workshop, 'latitude' | 'longitude'>): string | null {
  if (w.latitude == null || w.longitude == null) return null;
  return `https://www.openstreetmap.org/?mlat=${w.latitude}&mlon=${w.longitude}#map=17/${w.latitude}/${w.longitude}`;
}

/**
 * Posição atual (iOS, Android e web) pelo expo-location, só com a permissão "em uso". Devolve null
 * se o usuário negar ou a localização falhar; a lista então vem em ordem alfabética (#69).
 */
export async function currentPosition(): Promise<Origin | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: p.coords.latitude, longitude: p.coords.longitude };
  } catch {
    return null;
  }
}
