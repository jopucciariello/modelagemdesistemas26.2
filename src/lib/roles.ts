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
