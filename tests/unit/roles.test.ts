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
