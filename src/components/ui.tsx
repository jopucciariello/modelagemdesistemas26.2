// Small shared pieces of the tracker UI (RNF07: plain HTML forms, responsive CSS).
import { NavLinks } from "@/components/nav";
import { navItemsFor } from "@/lib/roles";
import { loadAccountRoles } from "@/lib/roles-server";
import { getCurrentUser } from "@/lib/session";
import { percent, type PlanWear } from "@/lib/wear";

/**
 * RB24: the menu follows the roles of the signed-in account (workshop, store, admin are added to the athlete menu).
 * The old `isAdmin` prop is ignored: admin rights are re-checked here against ADMIN_EMAILS (RB17).
 */
export async function Nav(_props: { isAdmin?: boolean }) {
  const user = await getCurrentUser();
  const roles = user ? await loadAccountRoles(user) : (["ATHLETE"] as const);
  return <NavLinks items={navItemsFor([...roles])} />;
}

/** Shows ?ok= and ?erro= feedback from a redirect. */
export function Flash({ ok, erro, okText, errText }: { ok?: unknown; erro?: unknown; okText: Record<string, string>; errText: Record<string, string> }) {
  return (
    <>
      {typeof erro === "string" && <p className="alert" role="alert">{errText[erro] ?? "Algo deu errado. Confira os dados e tente de novo."}</p>}
      {typeof ok === "string" && okText[ok] && <p className="ok" role="status">{okText[ok]}</p>}
    </>
  );
}

/** RF07-RF09: wear bar with the alert text. */
export function WearMeter({ wear }: { wear: PlanWear }) {
  return (
    <span className={`wear wear-${wear.status}`}>
      <span className="wear-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, Math.round(wear.ratio * 100))}%` }} />
      </span>
      <strong>{percent(wear.ratio)}</strong>
      {wear.alert && <span className="badge">{wear.alert}</span>}
    </span>
  );
}

export const km = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
export const hours = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;

export function interval(p: { intervalKm: number | null; intervalHours: number | null; action: string; warnKm?: number | null; warnHours?: number | null }) {
  const parts = [p.intervalKm ? km(p.intervalKm) : null, p.intervalHours ? hours(p.intervalHours) : null].filter(Boolean);
  const warn = [p.warnKm ? km(p.warnKm) : null, p.warnHours ? hours(p.warnHours) : null].filter(Boolean);
  return `${p.action === "SERVICE" ? "Revisão" : "Troca"} a cada ${parts.join(" ou ")}${warn.length ? ` (amarelo a partir de ${warn.join(" ou ")})` : ""}`;
}
