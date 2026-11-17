// RF31, RB15: pure validation of the help-menu forms (model requests and the admin answer).
import { text } from "@/lib/forms";

export const REQUEST_KINDS = { COMPONENT: "Componente", BIKE: "Bike (modelo)" } as const;
export type RequestKind = keyof typeof REQUEST_KINDS;

export const REQUEST_STATUS = { OPEN: "Aberto", REGISTERED: "Cadastrado", REJECTED: "Recusado" } as const;
export type RequestStatus = keyof typeof REQUEST_STATUS;

export type ModelRequestInput = { kind: RequestKind; family: string | null; text: string };
export type AnswerInput = { status: "REGISTERED" | "REJECTED"; reply: string | null };

/** Empty text is refused (SPEC-007, exception of UC15). */
export function readModelRequest(form: FormData): ModelRequestInput | null {
  const kind = text(form, "kind", 20);
  const body = text(form, "text", 1000);
  if (!(kind in REQUEST_KINDS) || !body) return null;
  return { kind: kind as RequestKind, family: text(form, "family", 60) || null, text: body };
}

/** A rejection needs a reason; a registration may carry an optional note. */
export function readAnswer(form: FormData): AnswerInput | null {
  const status = text(form, "status", 20);
  const reply = text(form, "reply", 1000) || null;
  if (status === "REGISTERED") return { status, reply };
  if (status === "REJECTED" && reply) return { status, reply };
  return null;
}
