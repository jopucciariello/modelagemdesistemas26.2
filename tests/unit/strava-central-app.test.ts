// RF04, RF32: the central Strava app is read from the environment and hidden when unset.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { stravaCentralApp } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("stravaCentralApp", () => {
  it("returns null when the credentials are not set", () => {
    vi.stubEnv("STRAVA_CLIENT_ID", "");
    vi.stubEnv("STRAVA_CLIENT_SECRET", "");
    expect(stravaCentralApp()).toBeNull();
  });

  it("returns null when only one of them is set", () => {
    vi.stubEnv("STRAVA_CLIENT_ID", "12345");
    vi.stubEnv("STRAVA_CLIENT_SECRET", "");
    expect(stravaCentralApp()).toBeNull();
  });

  it("returns the trimmed credentials when both are set", () => {
    vi.stubEnv("STRAVA_CLIENT_ID", " 12345 ");
    vi.stubEnv("STRAVA_CLIENT_SECRET", "abc ");
    expect(stravaCentralApp()).toEqual({ clientId: "12345", clientSecret: "abc" });
  });
});
