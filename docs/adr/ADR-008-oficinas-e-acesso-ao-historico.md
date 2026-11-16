# ADR-008 — Oficinas: acesso pelo e-mail Google e histórico compartilhado pelo agendamento

- **Status:** Proposto (aguarda aprovação de João)
- **Data:** 16/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-22, OPEN-24, OPEN-25 (propostas)
- **Requisitos relacionados:** RF25–RF29, RNF03, RB09, RB19, RB20

## Contexto

A Fase 3 acrescenta o perfil Mecânico/Oficina. Todos os usuários já entram com o Google (ADR-005) e o administrador é definido por uma lista de e-mails (ADR-002). Falta decidir como uma oficina entra, como o atleta autoriza a oficina a ver o histórico da bike (LGPD, RNF03) e como a oficina é avisada de cancelamentos.

## Decisão

1. **Entrada da oficina.** O administrador cadastra a oficina com o e-mail Google do responsável (`Workshop.ownerEmail`, único). Quem entra com esse e-mail, já verificado pelo Google, acessa `/oficina` e edita só a própria oficina. Não se cria um novo `Role`: a permissão é derivada da oficina ativa com esse e-mail e conferida a cada requisição, como a do admin (RB17, RB19).
2. **Autorização do histórico.** O agendamento é a autorização. A tela de agendamento avisa o que será compartilhado. A função pura `canWorkshopAccessBike` (RB09) libera o acesso só para agendamento `SCHEDULED` ou `COMPLETED` da mesma oficina e da mesma bike; `CANCELLED` ou outra oficina negam (RNF03). A oficina só lê; escreve apenas ao concluir o atendimento.
3. **Notificação.** Tabela `WorkshopNotice`, mostrada em `/oficina`. Cancelamento com menos de 24 h é marcado como urgente (RF29).
4. **Conclusão.** Ao concluir, o sistema cria uma `ServiceVisit` da bike com a oficina e os itens (RF36), reaproveitando a gravação de visitas da Fase 1.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Novo `Role` MECHANIC definido no primeiro login | Qualquer pessoa poderia se declarar oficina; o cadastro pelo admin dá confiança (e prepara a verificação de lojistas da Fase 2). |
| Consentimento separado do agendamento | Mais telas e mais fricção sem ganho: o atleta já escolhe oficina e bike ao agendar. |
| Notificação por e-mail | Exige provedor de e-mail e novos segredos; o OPEN-14 já adotou avisos só dentro do app. |

## Consequências

- Migração nova com `Workshop`, `WorkshopService`, `WorkshopSlot`, `Appointment` e `WorkshopNotice`.
- O admin ganha uma seção para cadastrar oficinas.
- A gravação de visita da Fase 1 foi extraída para `src/lib/visit-record.ts` e passou a ser usada pelo atleta e pela oficina.
