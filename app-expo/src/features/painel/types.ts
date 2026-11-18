/** Formato de GET /api/dashboard (espelha src/lib/dashboard-dto.ts; vira pacote compartilhado na issue #60). */
export type PlanDto = {
  planId: string;
  partLabel: string;
  componentLabel: string;
  planName: string;
  action: 'REPLACE' | 'SERVICE';
  intervalKm: number | null;
  intervalHours: number | null;
  km: number;
  hours: number;
  ratio: number;
  status: 'ok' | 'near' | 'due';
  alert: string | null;
};

export type BikeDto = {
  id: string;
  name: string;
  hasPhoto: boolean;
  photoVersion: number | null;
  alerts: number;
  due: number;
  plans: PlanDto[];
};

export type DashboardDto = { counts: { due: number; near: number; ok: number }; bikes: BikeDto[] };

/** Formato de GET /api/bikes/:id (espelha src/lib/bike-detail-dto.ts). */
export type BikeDetailDto = {
  id: string;
  name: string;
  type: string;
  archived: boolean;
  totals: { km: number; hours: number; rides: number };
  parts: { id: string; label: string; componentLabel: string; installedAt: string; plans: PlanDto[] }[];
  removedCount: number;
  events: { id: string; type: 'REPLACEMENT' | 'SERVICE' | 'MANUAL'; date: string; note: string; shop: string | null }[];
};
