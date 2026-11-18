# ADR-009 — Oficinas, mecânicos, agenda e OS

- **Status:** Aceito (17/11/2026, respostas de João a OPEN-40 a OPEN-44)
- **Data:** 16/11/2026; reescrito em 17/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-40, OPEN-41, OPEN-42, OPEN-43, OPEN-44
- **Requisitos relacionados:** RF25–RF29, RF38, RNF03, RB09, RB21, RB22, RB23

## Contexto

A Fase 3 acrescenta oficina e mecânico. Todos entram pelo login do ADR-005. Faltava decidir como a oficina entra, a agenda, o consentimento do atleta (LGPD), o aviso de cancelamento e o que acontece ao concluir uma OS.

## Decisão

1. **Entrada (OPEN-40).** A oficina **pede cadastro** com texto livre e contato; o administrador aprova em `/admin`. O responsável (e-mail do pedido) passa a editar a oficina e **convida mecânicos por e-mail** (`WorkshopMember`); o mecânico convidado entra com o próprio login e vê a área `/oficina`. Não há novo `Role`: a permissão é derivada da oficina ativa e conferida a cada requisição (RB21).
2. **Agenda (OPEN-41).** Grade semanal de horários (`WorkshopHour`: dia da semana, início e fim e slots). Cada serviço tem **duração estimada** que ocupa a agenda; um slot só aceita um agendamento ativo (RB22). Google Agenda é o "momento dois" e só fica documentado.
3. **Histórico (OPEN-42).** No agendamento o atleta escolhe se compartilha o histórico da bike. `canWorkshopAccessBike` (RB09) só libera para agendamento `SCHEDULED`/`COMPLETED` da mesma oficina e bike **com consentimento**; cancelado ou sem consentimento nega (RNF03).
4. **Cancelamento (OPEN-43).** Aviso no app (`WorkshopNotice`) e por e-mail; urgente se < 24 h (RF29). Depois, um WhatsApp Business do GearLog avisará (só documentado).
5. **Concluir a OS (OPEN-44).** Cria a `ServiceVisit` da bike (RF36), atualizando o histórico. Peças trocadas zeram o desgaste. Peças com revisões em etapas (ex.: suspensão em 100 h, depois 150 h) zeram e **avançam a meta de desgaste** para a etapa seguinte (RB23). O preço **não** entra na conclusão da OS; já o **valor do serviço** (opcional, `priceCents`) é exibido na lista de oficinas, como João descreveu em 17/11/2026 ("as revisões que cada uma oferece, valor, site").

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Admin cadastra a oficina sem pedido | João pediu pedido com texto e contato. |
| Horários avulsos sem duração | João pediu grade semanal e duração do serviço. |
| Agendamento é sempre a autorização | João pediu escolha do atleta. |
| Preço obrigatório no serviço | O valor é opcional; a oficina pode não informar. |

## Consequências

- Migração: `WorkshopMember` (convites), `WorkshopHour`, duração em `WorkshopService`, consentimento em `Appointment`, etapas em plano de peça (`stages`).
- A gravação da visita (`src/lib/visit-record.ts`) é compartilhada por atleta e oficina.
