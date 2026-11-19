// RF04, RF32, ADR-005: Google role assignment and safe return paths.
import { describe, expect, it } from "vitest";
import { roleForEmail } from "@/lib/google/oidc";
import { safeReturnPath } from "@/lib/redirects";

describe("RF04 / ADR-005: role from Google e-mail", () => {
  it("makes listed e-mails admin (case-insensitive) and every other verified e-mail an athlete", () => {
    expect(roleForEmail("Admin@Example.com", "admin@example.com, x@y.com")).toBe("ADMIN");
    expect(roleForEmail("someone@gmail.com", "admin@example.com")).toBe("ATHLETE");
    expect(roleForEmail("someone@gmail.com", "")).toBe("ATHLETE");
  });
  it("only returns to known same-site paths", () => {
    expect(safeReturnPath("/admin")).toBe("/admin");
    expect(safeReturnPath("/fonte")).toBe("/fonte");
    expect(safeReturnPath("https://evil.example")).toBe("/");
    expect(safeReturnPath("//evil.example")).toBe("/");
    expect(safeReturnPath(null)).toBe("/");
  });
});
