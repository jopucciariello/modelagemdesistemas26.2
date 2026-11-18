// RF41, #77: pushes one notification to every device of a user and forgets tokens that no longer exist.
import "server-only";
import { prisma } from "@/lib/db";
import { buildPushMessages, sendPush } from "@/lib/push";

export async function pushToUser(userId: string, title: string, body: string, href?: string | null): Promise<void> {
  const rows = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  const messages = buildPushMessages(rows.map((r) => r.token), title, body, href);
  const { dead } = await sendPush(messages);
  if (dead.length) await prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
}
