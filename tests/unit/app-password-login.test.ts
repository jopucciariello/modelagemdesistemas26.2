// RF04, #62: request parsing of the Expo app's password login (no database).
import { describe, expect, it } from "vitest";
import { parsePasswordBody } from "@/lib/api/password-login";

describe("parsePasswordBody", () => {
  it("accepts a login and defaults the name to the username", () => {
    expect(parsePasswordBody({ username: " Joao_Silva ", password: "senha-longa-123" })).toMatchObject({ mode: "login", username: "joao_silva", name: "joao_silva" });
  });
  it("accepts a sign-up with a display name", () => {
    expect(parsePasswordBody({ mode: "cadastro", username: "maria", password: "senha-longa-123", name: " Maria " })).toMatchObject({ mode: "cadastro", name: "Maria" });
  });
  it("rejects bad bodies and credentials", () => {
    expect(parsePasswordBody(null)).toBeNull();
    expect(parsePasswordBody({ username: 5, password: "x" })).toBeNull();
    expect(parsePasswordBody({ username: "maria", password: "curta" })).toBeNull();
    expect(parsePasswordBody({ username: "a b!", password: "senha-longa-123" })).toBeNull();
  });
});
