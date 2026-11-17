// RF01: serves the athlete's own bike picture, only to its owner.
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(_req: Request, ctx: RouteContext<"/bikes/[id]/foto">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const photo = await prisma.bikePhoto.findFirst({ where: { bikeId: id, bike: { userId: user.id } } });
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=300",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
