import { api, ApiError } from '@/lib/api';

const ERRORS: Record<string, string> = {
  pedal_invalido: 'Pedal inválido: confira bike, data, km e horas.',
  sync_not_linked: 'Conecte o Strava (ou o conector) nas configurações antes de sincronizar.',
  sync_unreachable: 'Não foi possível falar com a fonte agora. Os dados antigos continuam salvos.',
  sync_unauthorized: 'A fonte recusou o acesso. Reconecte nas configurações.',
  sync_bad_response: 'A fonte respondeu algo inesperado. Os dados antigos continuam salvos.',
  sync_unexpected: 'A sincronização falhou. Os dados antigos continuam salvos.',
};

function message(e: unknown): string {
  return e instanceof ApiError ? (ERRORS[e.message] ?? e.message) : 'Não foi possível concluir. Tente de novo.';
}

/** RF14: pedal lançado à mão. Devolve null se deu certo, ou o aviso de erro. */
export async function addRide(input: { bikeId: string; date: string; distanceKm: string; movingHours: string }) {
  try {
    await api('/api/rides', { method: 'POST', body: JSON.stringify({ ...input, sportType: 'Ride' }) });
    return null;
  } catch (e) {
    return message(e);
  }
}

/** RF13: sincroniza com a fonte e devolve quantos pedais vieram. */
export type RefreshRequest =
  | { status: 'queued' | 'not_linked' | 'failed' }
  | { status: 'rate_limited'; retryAfterSeconds: number | null }
  | null;

export async function syncRides(): Promise<{ imported: number; refresh: RefreshRequest } | { error: string }> {
  try {
    return await api<{ imported: number; refresh: RefreshRequest }>('/api/rides/sync', { method: 'POST' });
  } catch (e) {
    return { error: message(e) };
  }
}

/** OPEN-20: escolhe a bike de um pedal que veio sem bike. */
export async function chooseBike(rideId: string, bikeId: string) {
  try {
    await api(`/api/rides/${rideId}/bike`, { method: 'POST', body: JSON.stringify({ bikeId }) });
    return null;
  } catch (e) {
    return message(e);
  }
}

/** RF06, RF34: aviso sobre o pedido de releitura ao conector (sem nova tentativa automática). */
export function refreshNotice(refresh: RefreshRequest | undefined): string {
  if (!refresh) return '';
  switch (refresh.status) {
    case 'queued':
      return ' Pedimos ao conector para reler o Strava; atualize em instantes.';
    case 'rate_limited': {
      const min = refresh.retryAfterSeconds === null ? null : Math.max(1, Math.ceil(refresh.retryAfterSeconds / 60));
      return ` O conector só relê o Strava uma vez por hora${min === null ? '' : `; peça de novo em ${min >= 60 ? 'cerca de 1 hora' : `${min} min`}`}.`;
    }
    case 'not_linked':
      return ' A conta do Strava não está vinculada no conector.';
    default:
      return ' Não foi possível pedir a releitura ao conector agora.';
  }
}
