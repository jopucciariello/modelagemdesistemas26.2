// RF30: runs once when the server starts (Next.js instrumentation hook).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { prisma } = await import("@/lib/db");
  const { loadSeedIfEmpty } = await import("@/lib/catalog/load");
  try {
    if (await loadSeedIfEmpty(prisma)) console.log("catalog: spreadsheet loaded");
  } catch (error) {
    // Never block the server start; the admin can still load it from /admin.
    console.error("catalog: automatic load failed", error);
  }
}
