// API of the Expo app (ADR-010). All M3 routes live in src/lib/api/market-routes.ts.
import { handleApi } from "@/lib/api/market-routes";

type Ctx = { params: Promise<{ path: string[] }> };
const run = async (req: Request, ctx: Ctx) => handleApi(req, (await ctx.params).path);

export const GET = run, POST = run, PUT = run, PATCH = run, DELETE = run;
