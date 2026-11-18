// RF04, ADR-005: JSON body of the Expo app's username + password login/sign-up (issue #62).
import { isValidPassword, isValidUsername, normalizeUsername } from "@/lib/password";

export type PasswordBody = { mode: "login" | "cadastro"; username: string; password: string; name: string };

/** Returns the validated body, or null when it is malformed or the credentials are invalid. */
export function parsePasswordBody(raw: unknown): PasswordBody | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const mode = b.mode === "cadastro" ? "cadastro" : "login";
  if (typeof b.username !== "string" || typeof b.password !== "string") return null;
  const username = normalizeUsername(b.username);
  if (!isValidUsername(username) || !isValidPassword(b.password)) return null;
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  return { mode, username, password: b.password, name: name || username };
}
