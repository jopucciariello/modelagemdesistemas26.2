# Constituição do GearLog

A constituição em vigor é o [CLAUDE.md](../../CLAUDE.md) na raiz. Resumo dos princípios:

1. Spec antes do código: nada é implementado sem requisito em `docs/requisitos.md`.
2. Rastreabilidade: commit, PR e teste citam o ID do requisito; commit e PR citam a issue.
3. Decisão técnica relevante vira ADR em `docs/adr/`.
4. Escopo fechado: só bicicletas.
5. Fase 1 primeiro.
6. Agentes de IA não inventam requisito (`[PROPOSTO]`), não preenchem lacuna em silêncio (`OPEN-XX`) e não expõem segredo.

Se este resumo e o `CLAUDE.md` divergirem, vale o `CLAUDE.md`.
