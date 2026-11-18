// RF04, RNF02, ADR-005, #62: username + password login/sign-up for the Expo app. Returns a session token.
import { prisma } from "@/lib/db";
import { parsePasswordBody } from "@/lib/api/password-login";
import { clearFailures, hashPassword, isThrottled, recordFailure, verifyPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/session";

// Hash compared when the user does not exist, so timing does not reveal valid usernames.
const DUMMY_HASH = `scrypt$${"A".repeat(22)}$${"A".repeat(86)}`;
const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const body = parsePasswordBody(await request.json().catch(() => null));
  if (!body) return fail("Usuário ou senha inválidos.", 400);
  const { username, password } = body;

  if (body.mode === "cadastro") {
    if (await prisma.user.findUnique({ where: { username } })) return fail("Esse usuário já existe.", 409);
    const user = await prisma.user.create({
      data: { username, name: body.name, passwordHash: await hashPassword(password), role: "ATHLETE" },
    });
    return Response.json(await createSessionToken(user.id));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`u:${username}`, `ip:${ip}`];
  if (keys.some((k) => isThrottled(k))) return fail("Muitas tentativas. Tente de novo em alguns minutos.", 429);
  const user = await prisma.user.findUnique({ where: { username } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) {
    keys.forEach((k) => recordFailure(k));
    return fail("Usuário ou senha incorretos.", 401);
  }
  keys.forEach(clearFailures);
  return Response.json(await createSessionToken(user.id));
}
