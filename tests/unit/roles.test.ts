// RB24: one account, several roles.
import { describe, expect, it } from "vitest";
import { accountRoles } from "@/lib/roles";

describe("accountRoles (RB24)", () => {
  it("every account is at least an athlete", () => {
    expect(accountRoles({ isAdmin: false, hasWorkshop: false, hasMerchant: false })).toEqual(["ATHLETE"]);
  });
  it("an admin keeps the athlete role", () => {
    expect(accountRoles({ isAdmin: true, hasWorkshop: false, hasMerchant: false })).toEqual(["ATHLETE", "ADMIN"]);
  });
  it("one person can be athlete, admin, workshop and merchant together", () => {
    expect(accountRoles({ isAdmin: true, hasWorkshop: true, hasMerchant: true })).toEqual(["ATHLETE", "ADMIN", "WORKSHOP", "MERCHANT"]);
  });
});

import { navItemsFor } from "@/lib/roles";
import { activeHref } from "@/components/nav";

describe("navItemsFor (RB24)", () => {
  it("gives the athlete menu to everyone", () => {
    const labels = navItemsFor(["ATHLETE"]).map((i) => i.label);
    expect(labels).toContain("Painel");
    expect(labels).not.toContain("Minha oficina");
    expect(labels).not.toContain("Minha loja");
    expect(labels).not.toContain("Admin");
  });
  it("adds one entry per extra role, keeping the athlete menu", () => {
    const items = navItemsFor(["ATHLETE", "ADMIN", "WORKSHOP", "MERCHANT"]);
    expect(items.map((i) => i.label)).toEqual(expect.arrayContaining(["Painel", "Minha oficina", "Minha loja", "Admin"]));
    expect(items.find((i) => i.label === "Minha oficina")?.href).toBe("/oficina");
  });
});

describe("activeHref", () => {
  const items = navItemsFor(["ATHLETE", "MERCHANT", "WORKSHOP"]);
  it("lights only the most specific item", () => {
    expect(activeHref("/loja", items)).toBe("/loja");
    expect(activeHref("/mercado/abc", items)).toBe("/mercado");
    expect(activeHref("/oficina/atendimentos/1", items)).toBe("/oficina");
    expect(activeHref("/oficinas/xyz", items)).toBe("/oficinas");
    expect(activeHref("/fonte", items)).toBe("/configuracoes");
    expect(activeHref("/", items)).toBe("/");
  });
});
