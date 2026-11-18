import { api, ApiError } from '@/lib/api';

const ERRORS: Record<string, string> = {
  data: 'Data inválida (não pode ser antes da instalação da peça).',
  plano_invalido: 'Esse plano não pode ser reiniciado sozinho.',
  peca_encerrada: 'Essa peça já foi trocada.',
  componente: 'Componente não encontrado.',
  manutencao_invalida: 'Informe a data e o que foi feito.',
  peca_nao_encontrada: 'Peça não encontrada.',
  bike_nao_encontrada: 'Bike não encontrada.',
};

/** Data de hoje no formato YYYY-MM-DD, no fuso do aparelho. */
export function today(): string {
  return new Date().toLocaleDateString('sv-SE');
}

async function post(path: string, body: Record<string, string>): Promise<string | null> {
  try {
    await api(path, { method: 'POST', body: JSON.stringify(body) });
    return null;
  } catch (e) {
    if (e instanceof ApiError) return ERRORS[e.message] ?? e.message;
    return 'Não foi possível salvar. Tente de novo.';
  }
}

/** RB13: reinicia o contador de um plano (revisão) ou registra a troca do item. */
export const servicePlan = (planId: string, date: string) => post(`/api/plans/${planId}/service`, { date });

/** RF10: troca a peça por uma nova do mesmo modelo, com os mesmos planos zerados. */
export const replacePart = (partId: string, date: string) => post(`/api/parts/${partId}/replace`, { date });

/** RF12: manutenção manual sem trocar peça. */
export const addMaintenance = (bikeId: string, date: string, note: string) =>
  post(`/api/bikes/${bikeId}/maintenance`, { date, note });
