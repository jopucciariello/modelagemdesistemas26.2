# Estratégia de testes — GearLog (Fase 1)

## 1. Pirâmide

| Nível | Ferramenta | O que cobre | Onde |
|---|---|---|---|
| Unidade (regras puras) | Vitest | Desgaste, limiares, alertas, planos, revisão na oficina, mapeamento de pedais, datas | `tests/unit/wear`, `catalog`, `visit`, `rides-map` |
| Integração com `fetch` simulado | Vitest | Google OIDC, OAuth do Strava, cliente do conector, SSRF, criptografia, domínio canônico | `tests/unit/google-admin-login`, `strava-oauth`, `activity-sources`, `crypto`, `canonical-host` |
| Ponta a ponta | Playwright, manual por PR | Fluxos de tela com sessão real contra banco descartável | Roteiro na seção 4 |
| Estática | `tsc --noEmit`, ESLint | Tipos e padrões do Next/React | CI |

Nenhum teste chama Google, Strava ou conector de verdade, e nenhum precisa de segredo.

## 2. Do requisito ao teste

Cada `describe` começa pelo ID do requisito (ex.: `RF08 / OPEN-17: yellow from the minimum…`), e cada invariante das [Specs](specs.md) aponta para o teste que o verifica. A matriz requisito → código → teste está em [requisitos.md §5](requisitos.md#5-situação-da-implementação-e-rastreabilidade-rnf09).

| Spec | Arquivos de teste |
|---|---|
| SPEC-001 | `google-admin-login.test.ts`, `activity-sources.test.ts`, `crypto.test.ts` |
| SPEC-002 | `catalog.test.ts` |
| SPEC-003 | `catalog.test.ts`, `rides-map.test.ts` |
| SPEC-004 | `rides-map.test.ts`, `activity-sources.test.ts`, `strava-oauth.test.ts`, `crypto.test.ts` |
| SPEC-005 | `wear.test.ts` |
| SPEC-006 | `catalog.test.ts`, `wear.test.ts`, `visit.test.ts` |

## 3. Evidências

- **GitHub Actions:** o workflow [CI](../.github/workflows/ci.yml) roda em todo PR e push na `main`: `npm ci`, `prisma generate`, `tsc`, ESLint, Vitest e `next build`. O [deploy](../.github/workflows/deploy.yml) repete os testes antes de publicar. Histórico em [Actions](https://github.com/jopucciariello/modelagemdesistemas26.2/actions).
- **Resultado em 13/11/2026:** 9 arquivos, 79 testes passando.
- **Ponta a ponta:** cada PR de funcionalidade (#40 a #44) registra no corpo o roteiro executado e o resultado.

## 4. Roteiro ponta a ponta

1. `prisma migrate deploy` num banco descartável (`prisma/e2e.db`).
2. Inserir um usuário e uma sessão com hash conhecido.
3. `next build && next start` com `DATABASE_URL=file:./prisma/e2e.db`.
4. Playwright com o cookie `gearlog_session` percorre: criar bike de modelo com data retroativa → lançar pedais → painel com alerta → revisão na oficina com vários itens → histórico.
5. Apagar o banco descartável.

## 5. Lacunas

- Server actions não têm teste automatizado de integração com banco; dependem do roteiro ponta a ponta. Próximo passo: testes com SQLite em memória para `createBike`, `recordShopVisit` e `syncRides`.
- Sem teste automatizado de interface no CI (o Playwright roda à mão).
