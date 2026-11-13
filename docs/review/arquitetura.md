# Revisão de arquitetura

Referência: [docs/arquitetura.md](../arquitetura.md).

## O que está bom

- Regras de desgaste, catálogo, visita e mapeamento de pedais são módulos puros sem Prisma e sem UI (RNF08), testados com Node.
- Toda server action começa por `requireUser()` ou `requireAdmin()` e toda consulta filtra pelo dono.
- O desgaste é derivado dos pedais (ADR-007): editar ou reimportar um pedal nunca deixa contador inconsistente.
- A revisão na oficina grava numa transação única.

## Achados

| # | Achado | Severidade | Ação |
|---|---|---|---|
| A1 | O código estava só na branch `feat/RF04-baseline` (PR #35 aberto), e o deploy rodava a partir dela | Média | **Feito:** documentação e merge na `main` |
| A2 | Não havia CI: PR podia entrar com teste ou tipo quebrado, e o deploy publicava sem testar | Média | **Feito:** `.github/workflows/ci.yml` e passo de testes no `deploy.yml` |
| A3 | A sincronização sobrescreve `bikeId` pelo `gear_id` da fonte, então um pedal sem bike no Strava não pode ser atribuído à mão | Média | Planejado: T-16 (OPEN-20) |
| A4 | Exclusões no Strava não chegam ao GearLog (o feed `/v1/gearlog/events` do conector não é lido) | Média | Planejado: T-17 |
| A5 | Sete ADRs contra a faixa de 3 a 5 pedida pela disciplina | Baixa | OPEN-19 (fusão proposta) |
