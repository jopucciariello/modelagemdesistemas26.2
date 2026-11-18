// Next mount of the workshop API (#71). The same handler runs in the Node API of ADR-010.
import { connection } from "next/server";
import { userFromBearer } from "@/lib/api/bearer";
import { handleOficinas } from "@/lib/api/oficinas";

async function handle(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  await connection();
  const { path = [] } = await ctx.params;
  return handleOficinas(req, path, userFromBearer);
}

export { handle as GET, handle as POST };
