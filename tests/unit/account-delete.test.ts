// RF40, #76: rules of the in-app account deletion (no database).
import { describe, expect, it } from "vitest";
import { checkAccountDeletion } from "@/lib/account-delete";

describe("checkAccountDeletion", () => {
  it("accepts the typed confirmation for an athlete, ignoring case and spaces", () => {
    expect(checkAccountDeletion("ATHLETE", { confirm: "EXCLUIR" })).toEqual({ ok: true });
    expect(checkAccountDeletion("ATHLETE", { confirm: " excluir " })).toEqual({ ok: true });
  });
  it("refuses a missing or wrong confirmation", () => {
    expect(checkAccountDeletion("ATHLETE", {})).toEqual({ ok: false, error: "confirmacao_invalida" });
    expect(checkAccountDeletion("ATHLETE", { confirm: "sim" })).toEqual({ ok: false, error: "confirmacao_invalida" });
    expect(checkAccountDeletion("ATHLETE", null)).toEqual({ ok: false, error: "confirmacao_invalida" });
  });
  it("does not let an admin delete their own account (RF37)", () => {
    expect(checkAccountDeletion("ADMIN", { confirm: "EXCLUIR" })).toEqual({ ok: false, error: "admin_nao_exclui" });
  });
});
