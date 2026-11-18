// RF37, RB17: ADMIN_EMAILS (root) + database e-mails.
import { describe, expect, it } from "vitest";
import { isRootAdmin, mergeAdminSettings } from "@/lib/admin-list";
import { isAuthorizedAdmin } from "@/lib/google/oidc";

describe("RF37 admin list", () => {
  it("merges the environment list with database e-mails, deduplicated and lower-case", () => {
    const merged = mergeAdminSettings("A@x.com, b@x.com", ["B@x.com", " c@x.com "]);
    expect(merged.split(",").sort()).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });
  it("authorizes an e-mail added in /admin", () => {
    expect(isAuthorizedAdmin("c@x.com", mergeAdminSettings("a@x.com", ["c@x.com"]))).toBe(true);
    expect(isAuthorizedAdmin("d@x.com", mergeAdminSettings("a@x.com", ["c@x.com"]))).toBe(false);
  });
  it("root admins come only from the environment", () => {
    expect(isRootAdmin("A@x.com", "a@x.com")).toBe(true);
    expect(isRootAdmin("c@x.com", "a@x.com")).toBe(false);
  });
});
