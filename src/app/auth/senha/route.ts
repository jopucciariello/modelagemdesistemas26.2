// RF04, RNF02, ADR-005: username + password sign-up and login. Accounts without e-mail are never admins (RB17).
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";
import {
  clearFailures,
  hashPassword,
  isThrottled,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  recordFailure,
  verifyPassword,
} from "@/lib/password";
import { createSession } from "@/lib/session";

const to = (path: string) => NextResponse.redirect(new URL(path, appUrl()), 303);
// Hash compared when the user does not exist, so timing does not reveal valid usernames.
const DUMMY_HASH = `scrypt$${"A".repeat(22)}$${"A".repeat(86)}`;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const mode = String(form.get("mode") ?? "");
  const username = normalizeUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!isValidUsername(username) || !isValidPassword(password)) return to("/entrar?erro=dados_invalidos");

  if (mode === "cadastro") {
    const name = String(form.get("name") ?? "").trim().slice(0, 80) || username;
    if (await prisma.user.findUnique({ where: { username } })) return to("/entrar?erro=usuario_existe");
    const user = await prisma.user.create({
      data: { username, name, passwordHash: await hashPassword(password), role: "ATHLETE" },
    });
    await createSession(user.id);
    return to("/");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`u:${username}`, `ip:${ip}`];
  if (keys.some((k) => isThrottled(k))) return to("/entrar?erro=muitas_tentativas");
  const user = await prisma.user.findUnique({ where: { username } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) {
    keys.forEach((k) => recordFailure(k));
    return to("/entrar?erro=credenciais");
  }
  keys.forEach(clearFailures);
  await createSession(user.id);
  return to("/");
}
