// Issue #61 (RF04): Expo app login returns a token to its own deep link only.
import { describe, expect, it } from "vitest";
import { bearerToken } from "@/lib/bearer";
import { safeAppRedirect } from "@/lib/redirects";

const APP = "https://gearlog.jopucci.com";

describe("safeAppRedirect", () => {
  it("accepts the app deep link, Expo Go and the site's own origin", () => {
    expect(safeAppRedirect("gearlog://auth", APP)).toBe("gearlog://auth");
    expect(safeAppRedirect("exp://192.168.0.5:8081/--/auth", APP)).toContain("exp://");
    expect(safeAppRedirect("https://gearlog.jopucci.com/auth", APP)).toBe("https://gearlog.jopucci.com/auth");
  });

  it("accepts the Expo web dev server on localhost only on its own ports", () => {
    expect(safeAppRedirect("http://localhost:8081/auth", APP)).toBe("http://localhost:8081/auth");
    expect(safeAppRedirect("http://localhost:19006/auth", APP)).toBe("http://localhost:19006/auth");
    expect(safeAppRedirect("http://localhost:9999/auth", APP)).toBeNull();
    expect(safeAppRedirect("http://localhost:8081.evil.com/auth", APP)).toBeNull();
    expect(safeAppRedirect("https://localhost:8081/auth", APP)).toBeNull();
  });

  it("refuses other hosts, odd schemes, credentials and garbage", () => {
    expect(safeAppRedirect("https://evil.example/auth", APP)).toBeNull();
    expect(safeAppRedirect("javascript:alert(1)", APP)).toBeNull();
    expect(safeAppRedirect("https://user:pw@gearlog.jopucci.com/auth", APP)).toBeNull();
    expect(safeAppRedirect("not a url", APP)).toBeNull();
    expect(safeAppRedirect("", APP)).toBeNull();
    expect(safeAppRedirect(null, APP)).toBeNull();
  });
});

describe("bearerToken", () => {
  const token = "A".repeat(43);
  it("reads a well-formed header", () => {
    expect(bearerToken(`Bearer ${token}`)).toBe(token);
  });
  it("refuses missing, short or malformed headers", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("Bearer short")).toBeNull();
    expect(bearerToken(`Basic ${token}`)).toBeNull();
    expect(bearerToken(`Bearer ${token} extra`)).toBeNull();
  });
});
