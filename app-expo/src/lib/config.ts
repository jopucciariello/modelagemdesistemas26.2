/** Base URL da API do GearLog (ADR-010). Defina EXPO_PUBLIC_API_URL; sem ela, o app avisa na tela de login. */
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
