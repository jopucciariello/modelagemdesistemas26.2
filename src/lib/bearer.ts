/** Extracts the token from `Authorization: Bearer <token>`; null when absent or malformed. */
export function bearerToken(header: string | null): string | null {
  const match = /^Bearer\s+([A-Za-z0-9_-]{20,})$/.exec(header ?? "");
  return match ? match[1] : null;
}
