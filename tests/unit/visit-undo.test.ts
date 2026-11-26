// RF28: deleting a concluded service restores the wear counters and the replaced parts.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { undoVisit } from "@/lib/visit-record";

describe("undoVisit", () => {
  it("restores plans, brings replaced parts back and deletes the visit", async () => {
    const calls: string[] = [];
    const undoJson = JSON.stringify([
      { k: "plan", planId: "pl1", lastServiceAt: "2026-10-01T00:00:00.000Z", stageIndex: 0, intervalHours: 100 },
      { k: "replace", oldPartId: "old", newPartId: "new" },
    ]);
    const tx = {
      serviceVisit: { findUnique: async () => ({ undoJson }), delete: async () => void calls.push("visit.delete") },
      maintenancePlan: { updateMany: async (a: { where: { id: string }; data: { stageIndex: number } }) => void calls.push(`plan:${a.where.id}:${a.data.stageIndex}`) },
      part: {
        deleteMany: async (a: { where: { id: string } }) => void calls.push(`part.delete:${a.where.id}`),
        updateMany: async (a: { where: { id: string }; data: { removedAt: null } }) => void calls.push(`part.restore:${a.where.id}:${a.data.removedAt}`),
      },
    };
    await undoVisit(tx as never, "v1");
    expect(calls).toEqual(["part.delete:new", "part.restore:old:null", "plan:pl1:0", "visit.delete"]);
  });
});
