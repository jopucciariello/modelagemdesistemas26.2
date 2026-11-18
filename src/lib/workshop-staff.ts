// RF25, RB21, RF25 approval (#30, #70): database glue for the workshop back-office and the admin queue.
// Framework-agnostic so the Expo API and the Node API can share it.
import { prisma } from "@/lib/db";
import type { ProfileInput, ServiceInput } from "@/lib/workshop-input";
import { canDecideRequest, canInviteMechanic, cleanWorkshopRequest, type GridHour } from "@/lib/workshop";

type Person = { email: string | null };

/** RB21: the workshop where the person is owner or invited mechanic (verified e-mail), approved and active only. */
export async function staffWorkshop(person: Person) {
  if (!person.email) return null;
  const email = person.email.toLowerCase();
  const workshop = await prisma.workshop.findFirst({
    where: { active: true, status: "ACTIVE", OR: [{ ownerEmail: email }, { members: { some: { email } } }] },
  });
  return workshop ? { workshop, isOwner: workshop.ownerEmail === email } : null;
}

/** The back-office screen: workshop, grid, services, mechanics, upcoming appointments and notices; or the request status. */
export async function myWorkshopView(person: Person) {
  const staff = await staffWorkshop(person);
  if (!staff) {
    const request = person.email ? await prisma.workshop.findUnique({ where: { ownerEmail: person.email.toLowerCase() }, select: { status: true, name: true } }) : null;
    return { workshop: null, request };
  }
  const w = staff.workshop;
  const id = w.id;
  const [hours, services, members, appointments, notices] = await Promise.all([
    prisma.workshopHour.findMany({ where: { workshopId: id }, orderBy: [{ weekday: "asc" }, { startMin: "asc" }] }),
    prisma.workshopService.findMany({ where: { workshopId: id, active: true }, orderBy: { name: "asc" } }),
    prisma.workshopMember.findMany({ where: { workshopId: id }, select: { id: true, email: true } }),
    prisma.appointment.findMany({
      where: { workshopId: id, status: "SCHEDULED" },
      include: { slot: { select: { startsAt: true } }, service: { select: { name: true } }, bike: { select: { name: true } }, user: { select: { name: true } } },
      orderBy: { slot: { startsAt: "asc" } },
    }),
    prisma.workshopNotice.findMany({ where: { workshopId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return {
    workshop: {
      id, isOwner: staff.isOwner, name: w.name, description: w.description, address: w.address, phone: w.phone,
      website: w.website, latitude: w.latitude, longitude: w.longitude, ownerEmail: w.ownerEmail,
    },
    hours: hours.map(({ weekday, startMin, endMin }) => ({ weekday, startMin, endMin })),
    services,
    members: staff.isOwner ? members : [],
    appointments: appointments.map((a) => ({
      id: a.id, startsAt: a.slot.startsAt.toISOString(), athlete: a.user.name, bike: a.bike.name, service: a.service?.name ?? null, shareHistory: a.shareHistory,
    })),
    notices,
  };
}

export type RequestResult = { ok: true } | { ok: false; error: "invalid" | "no_email" | "exists" };

/** RF25, OPEN-40: the signed-in user asks to register a workshop; a rejected one can ask again. */
export async function requestRegistration(person: Person, raw: unknown): Promise<RequestResult> {
  if (!person.email) return { ok: false, error: "no_email" };
  const input = cleanWorkshopRequest(typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {});
  if (!input) return { ok: false, error: "invalid" };
  const ownerEmail = person.email.toLowerCase();
  const existing = await prisma.workshop.findUnique({ where: { ownerEmail } });
  if (existing && !canDecideRequest(existing.status, "reopen")) return { ok: false, error: "exists" };
  if (existing) await prisma.workshop.update({ where: { id: existing.id }, data: { ...input, status: "PENDING", active: false } });
  else await prisma.workshop.create({ data: { ...input, ownerEmail, status: "PENDING", active: false } });
  return { ok: true };
}

export const updateProfile = (workshopId: string, p: ProfileInput) => prisma.workshop.update({ where: { id: workshopId }, data: p });

export const addService = (workshopId: string, s: ServiceInput) => prisma.workshopService.create({ data: { workshopId, ...s } });

/** Kept in old appointments; only hidden from new bookings. */
export const removeService = (workshopId: string, serviceId: string) =>
  prisma.workshopService.updateMany({ where: { id: serviceId, workshopId }, data: { active: false } });

/** RF25: replaces the whole weekly grid (rows already validated by parseHours). */
export async function replaceHours(workshopId: string, hours: readonly GridHour[]) {
  await prisma.$transaction([
    prisma.workshopHour.deleteMany({ where: { workshopId } }),
    prisma.workshopHour.createMany({ data: hours.map((h) => ({ workshopId, ...h })) }),
  ]);
}

export type InviteResult = { ok: true } | { ok: false; error: "invalid" | "not_owner" | "is_owner" | "duplicate" };

/** RB21: only the owner invites mechanics by e-mail. */
export async function inviteMember(workshop: { id: string; ownerEmail: string }, actor: Person, rawEmail: unknown): Promise<InviteResult> {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "invalid" };
  const members = await prisma.workshopMember.findMany({ where: { workshopId: workshop.id }, select: { email: true } });
  const check = canInviteMechanic(actor.email, workshop.ownerEmail, email, members.map((m) => m.email));
  if (check !== "ok") return { ok: false, error: check };
  await prisma.workshopMember.create({ data: { workshopId: workshop.id, email } });
  return { ok: true };
}

export const removeMember = (workshopId: string, memberId: string) => prisma.workshopMember.deleteMany({ where: { id: memberId, workshopId } });

/** RF25: the admin queue of pending requests (and the decided ones, newest first). */
export async function adminRequests() {
  return prisma.workshop.findMany({
    where: { status: { in: ["PENDING", "REJECTED"] } },
    select: { id: true, name: true, ownerEmail: true, contact: true, requestText: true, status: true, createdAt: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function adminDecide(workshopId: string, decision: "approve" | "reject"): Promise<boolean> {
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
  if (!workshop || !canDecideRequest(workshop.status, decision)) return false;
  const approved = decision === "approve";
  await prisma.workshop.update({ where: { id: workshopId }, data: { status: approved ? "ACTIVE" : "REJECTED", active: approved } });
  return true;
}
