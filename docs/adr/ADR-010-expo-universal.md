# ADR-010 — Interface em Expo universal (web, iOS e Android) e backend como API

- **Status:** Aceito (17/11/2026, confirmado por João)
- **Data:** 17/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-46
- **Substitui parcialmente:** [ADR-001](ADR-001-stack.md) (camada de interface)
- **Requisitos relacionados:** RNF04, RNF07, RF04, RF15, RF21, RF22, RF29; Fases 1, 2 e 3

## Contexto

O produto precisa ser **site e aplicativo** (iOS e Android, nas lojas da Apple e do Google), com a mesma experiência. A interface atual é Next.js (páginas e server actions) e só atende ao navegador. Em 17/11/2026 o usuário decidiu migrar para a última versão do Expo, **trocando** o Next.js, sem manter o site atual como plano B depois da troca de domínio.

## Alternativas consideradas

| Alternativa | Vantagem | Desvantagem |
|---|---|---|
| A) Expo universal (Expo Router) substitui o Next.js | Um código para web, iOS e Android; push nativo; lojas | Reescrever toda a interface e extrair um backend de API |
| B) App Expo nativo e Next.js mantido como site | Site atual intacto | Duas interfaces para manter; o usuário não quer |
| C) Expo depois de 26/11 | Menor risco de prazo | Adia o app e as lojas |

## Decisão

**Alternativa A.**

- **Interface:** Expo (última SDK estável) com Expo Router, TypeScript, para web, iOS e Android.
- **Backend:** API HTTP separada em Node.js/TypeScript, no Fly, que reaproveita `src/lib` (Prisma + SQLite, regras de desgaste, catálogo, conector Strava). O banco e as regras de domínio não mudam ([ADR-001](ADR-001-stack.md), [ADR-007](ADR-007-desgaste-calculado-dos-pedais.md)).
- **Auth:** login Google e usuário/senha com **token** para o app (e cookie no site, se couber), mantendo [ADR-005](ADR-005-login.md); login Google/Strava no app por deep link.
- **Dados do domínio** (desgaste, catálogo, validações) passam a um pacote compartilhado entre a API e o app.
- **Visual:** reformulação no estilo do portfólio do usuário (issue #63).
- **Lojas:** Apple e Google; push nativo (APNs/FCM) em milestone própria (M4).

## Consequências

- A troca de domínio para o Expo só acontece depois da paridade da Fase 1 comprovada por testes e checklist (issue #68). Sem plano B depois disso: se a paridade atrasar, a entrega de 26/11 corre risco (risco aceito pelo usuário).
- O push nativo não funciona no Expo Go; exige build nativo (EAS).
- A revisão das lojas leva dias; o primeiro envio deve ocorrer até 20/11.
- Server actions e páginas do Next viram endpoints da API e telas do Expo; as regras puras e os testes de domínio permanecem.
- `docs/arquitetura.md` e `plan.md` precisam ser atualizados quando este ADR for aceito.
