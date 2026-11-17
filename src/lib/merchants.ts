// RF18, RF24, RB06: pure helpers for merchant registration and listing moderation.

/** RF18: e-mails are matched case-insensitively and without surrounding spaces. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const MIN_REASON = 5;
export const MAX_REASON = 300;

/** RF24: a removal needs a reason. Returns the cleaned reason, or null when missing or too short. */
export function cleanRemovalReason(raw: string): string | null {
  const reason = raw.trim().replace(/\s+/g, " ").slice(0, MAX_REASON);
  return reason.length >= MIN_REASON ? reason : null;
}

/** RF18, RB06: the stamp kept with the seal; revoking clears it (INV-049). */
export function verificationFields(verified: boolean, now = new Date()): { verified: boolean; verifiedAt: Date | null } {
  return { verified, verifiedAt: verified ? now : null };
}
