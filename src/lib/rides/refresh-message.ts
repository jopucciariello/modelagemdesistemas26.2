// RF06, RF34: wording for the connector refresh request shown after "Sincronizar" (pt-BR).
export function waitText(seconds: number | null): string {
  if (seconds === null) return "mais tarde";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? "em cerca de 1 hora" : `em ${minutes} min`;
}

export function refreshMessage(status: string | undefined, retryAfterSeconds: number | null): string | null {
  switch (status) {
    case "queued":
      return "Pedimos ao conector para reler o Strava (bikes novas e edições antigas). O resultado chega em instantes: atualize a página depois.";
    case "limite":
    case "rate_limited":
      return `O conector só relê o Strava uma vez por hora. Você poderá pedir de novo ${waitText(retryAfterSeconds)}. Enquanto isso, mostramos o que ele já tem.`;
    case "not_linked":
      return "A conta do Strava não está vinculada no conector. Vincule de novo no conector.";
    case "failed":
      return "Não foi possível pedir a releitura ao conector agora. Mostramos o que ele já tem.";
    default:
      return null;
  }
}
