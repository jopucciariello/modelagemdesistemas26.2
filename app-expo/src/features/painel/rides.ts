import { api, ApiError } from '@/lib/api';

const ERRORS: Record<string, string> = {
  pedal_invalido: 'Pedal inválido: confira bike, data, km e horas.',
  sync_not_linked: 'Conecte o Strava nas configurações antes de sincronizar.',
  sync_unreachable: 'Não foi possível falar com o Strava agora. Os dados antigos continuam salvos.',
  sync_unauthorized: 'O Strava recusou o acesso. Reconecte nas configurações.',
  sync_bad_response: 'O Strava respondeu algo inesperado. Os dados antigos continuam salvos.',
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

/** RF13: sincroniza com o Strava e devolve quantos pedais vieram. */
export async function syncRides(): Promise<{ imported: number } | { error: string }> {
  try {
    return await api<{ imported: number }>('/api/rides/sync', { method: 'POST' });
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
