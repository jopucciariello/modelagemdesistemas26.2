# plan.md — Plano técnico do GearLog (Fase 1)

Como o [spec.md](spec.md) é implementado. Decisões detalhadas em [docs/arquitetura.md](docs/arquitetura.md) e nos [ADRs](docs/adr/). Tarefas em [tasks.md](tasks.md).

## 1. Stack

| Camada | Escolha | Registro |
|---|---|---|
| Linguagem | TypeScript | ADR-001 |
| Web | Next.js 16 (App Router, server actions, formulários HTML) | ADR-001 |
| Dados | Prisma 7 + SQLite (`better-sqlite3`), migrações versionadas | ADR-001 |
| Testes | Vitest (unidade, regras puras e integrações com `fetch` simulado) | ADR-001 |
| Login | Google OpenID Connect com PKCE; admin por lista de e-mails | ADR-002, ADR-005 |
| Pedais | Manual, API do Strava com app do atleta ou conector do atleta | ADR-006 |
| Desgaste | Calculado na leitura a partir dos pedais guardados | ADR-007 |
| Segredos | Infisical (OIDC no deploy); dados de terceiros criptografados (AES-256-GCM) | ADR-003 |
| Deploy | Fly.io, uma máquina em `gru`, volume para o SQLite, GitHub Actions | ADR-004 |

## 2. Estrutura do repositório

```
src/app/            páginas, rotas OAuth e server actions (aplicação)
src/lib/            regras puras (wear, catalog/rules, visit, rides/map) e infraestrutura
src/components/     componentes de UI
prisma/             schema.prisma e migrações
tests/unit/         testes Vitest
docs/               documentação (requisitos, UC, domínio, UML, specs, ADRs, review)
.specify/           ponteiros do fluxo SDD (constituição, modelos)
.github/workflows/  CI (ci.yml) e deploy (deploy.yml)
```

## 3. Ordem de implementação

Segue o [mapa de Specs](docs/mapa-specs.md): SPEC-001 → 002 → 003 → 004 → 005 → 006 → 007. Cada Spec é uma fatia vertical: esquema, regra pura com teste, server action, tela.

## 4. Estratégia de testes

Regras de negócio em módulos puros testados sem banco; integrações com Google, Strava e conector testadas com `fetch` simulado; fluxos de tela verificados ponta a ponta com Playwright contra um banco descartável antes de cada merge. Detalhe e evidências em [docs/testes.md](docs/testes.md).

## 5. Qualidade e segurança

- CI em todo PR: tipos (`tsc`), lint (`eslint`), testes (`vitest`) e build.
- Deploy só depois dos mesmos testes.
- Revisão por dimensão (arquitetura, desempenho, segurança, observabilidade) em [docs/review/](docs/review/), com as ações tomadas.

## 6. Riscos

| Risco | Mitigação |
|---|---|
| Limite de leituras do Strava | Cada atleta usa o próprio app ou o conector (ADR-006); paginação limitada |
| Perda do volume do SQLite | Backup diário do volume (tarefa T-21) |
| Regras de desgaste simplificadas | Valores são recomendações; recalibração pela medição real (issue #38) |
| Prazo (26/11) | Fase 1 primeiro; Fases 2 e 3 só documentadas |
