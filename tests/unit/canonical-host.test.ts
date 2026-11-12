// ADR-004: the app is only served on the custom domain.
import { describe, expect, it } from "vitest";
import { canonicalRedirect } from "@/lib/canonical-host";

const APP = "https://gearlog.jopucci.com";

describe("ADR-004 canonical host", () => {
  it("redirects *.fly.dev to the custom domain, keeping path and query", () => {
    expect(canonicalRedirect("http://gearlog.fly.dev/admin?erro=x", "gearlog.fly.dev", APP)).toBe(
      "https://gearlog.jopucci.com/admin?erro=x",
    );
  });
  it("leaves the custom domain, localhost and internal health checks alone", () => {
    expect(canonicalRedirect("https://gearlog.jopucci.com/", "gearlog.jopucci.com", APP)).toBeNull();
    expect(canonicalRedirect("http://localhost:3000/", "localhost:3000", "http://localhost:3000")).toBeNull();
    expect(canonicalRedirect("http://172.19.0.2:3000/", "172.19.0.2:3000", APP)).toBeNull();
  });
  it("does nothing without APP_URL or host", () => {
    expect(canonicalRedirect("http://gearlog.fly.dev/", "gearlog.fly.dev", undefined)).toBeNull();
    expect(canonicalRedirect("http://gearlog.fly.dev/", null, APP)).toBeNull();
  });
});
