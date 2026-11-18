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
