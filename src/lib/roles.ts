// RB24: a single account can hold several roles at once. ATHLETE is the base role of every account;
// ADMIN, WORKSHOP (owner or mechanic) and MERCHANT are added on top and never replace it.

export type AccountRole = "ATHLETE" | "ADMIN" | "WORKSHOP" | "MERCHANT";

export type RoleFacts = { isAdmin: boolean; hasWorkshop: boolean; hasMerchant: boolean };

/** Lists every role the account holds, always starting with ATHLETE. */
export function accountRoles(facts: RoleFacts): AccountRole[] {
  const roles: AccountRole[] = ["ATHLETE"];
  if (facts.isAdmin) roles.push("ADMIN");
  if (facts.hasWorkshop) roles.push("WORKSHOP");
  if (facts.hasMerchant) roles.push("MERCHANT");
  return roles;
}

export type NavItem = { href: string; label: string };

const BASE_NAV: NavItem[] = [
  { href: "/", label: "Painel" },
  { href: "/pedais", label: "Pedais" },
  { href: "/mercado", label: "Mercado" },
  { href: "/sonhos", label: "Sonhos" },
  { href: "/notificacoes", label: "Avisos" },
  { href: "/oficinas", label: "Oficinas" },
  { href: "/ajuda", label: "Ajuda" },
  { href: "/configuracoes", label: "Configurações" },
];

/** RB24: the athlete menu plus one entry per extra role the account holds (workshop, store, admin). */
export function navItemsFor(roles: AccountRole[]): NavItem[] {
  const items = [...BASE_NAV];
  if (roles.includes("WORKSHOP")) items.push({ href: "/oficina", label: "Minha oficina" });
  if (roles.includes("MERCHANT")) items.push({ href: "/mercado/meus", label: "Minha loja" });
  if (roles.includes("ADMIN")) items.push({ href: "/admin", label: "Admin" });
  return items;
}
