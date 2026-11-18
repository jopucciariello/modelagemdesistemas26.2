// RF37: pure helpers for the admin e-mail list.
import { parseAdminEmails } from "@/lib/google/oidc";

/** Joins the ADMIN_EMAILS setting with e-mails stored in the database (deduplicated, lower-case). */
export function mergeAdminSettings(setting: string, extra: string[]): string {
  return [...new Set([...parseAdminEmails(setting), ...extra.map((e) => e.trim().toLowerCase()).filter(Boolean)])].join(",");
}

/** Root admins (from the environment) cannot be removed from /admin. */
export function isRootAdmin(email: string, setting: string): boolean {
  return parseAdminEmails(setting).has(email.toLowerCase());
}
