# Decisões em Aberto — GearLog

Lacunas que precisam de decisão humana. Nenhuma delas pode ser preenchida em silêncio (`CLAUDE.md`). Quando uma decisão for tomada, registrar a resposta, a data e, se ela amarrar o projeto, o ADR correspondente.

| ID | Decisão necessária | Afeta | Como resolver | Status |
|---|---|---|---|---|
| OPEN-01 | Uma atividade `VirtualRide` (rolo) desgasta todas as peças ou só a transmissão? | RB03, RF06, `integracao-strava.md` §3 | Decidido em 06/11/2026: só desgasta as categorias marcadas no catálogo como "desgasta em rolo" (RB14) | **Resolvida** |
| OPEN-02 | Os termos da API do Strava permitem mostrar a km/horas de uso de uma peça a outros usuários no marketplace? | RB07, RF16 | Consultar os termos da API do Strava antes de implementar a Fase 2 | Adiada (segundo estágio) |
| OPEN-03 | Qual a stack (frontend, backend, banco)? O README lista apenas candidatas. | Arquitetura, `plan.md` | Decidido em 06/11/2026: TypeScript com Next.js, Prisma + SQLite e Vitest. Registrado no [ADR-001](adr/ADR-001-stack.md) | **Resolvida** |
| OPEN-04 | Quem são os integrantes do grupo (2 ou 3) e seus usernames no GitHub? | `combinados.md`, distribuição das issues | Decidido em 06/11/2026: projeto individual (João, `jopucciariello`) | **Resolvida** |
| OPEN-05 | O prazo final é 26/11 (calendário de provas e plano de ensino) ou 23–27/11 (PDF do projeto)? | Planejamento | Decidido em 06/11/2026: entrega em 26/11/2026 | **Resolvida** |
| OPEN-06 | A disciplina exige ao menos 2 perfis com permissões diferentes no MVP, mas a Fase 1 só tem o perfil Atleta. | Visão, RF30, escopo do MVP | Aprovado em 06/11/2026: RF30, Admin mantém o catálogo de categorias e componentes | **Resolvida** |
| OPEN-07 | Uma peça pode ter vários planos de manutenção (ex.: garfo com revisão de lowers a cada 50 h e completa a cada 125 h)? | `requisitos.md` §4 **[PROPOSTO]**, modelo de domínio | Decidido em 06/11/2026: sim, uma peça tem um ou mais planos (RB16) | **Resolvida** |
| OPEN-08 | No cadastro de peça (RF02), o atleta escolhe o componente só do catálogo do admin (RF30) ou também pode digitar marca/modelo livremente quando o componente não existir? | RF02, RF30, modelo de domínio | Decidido em 06/11/2026: categoria e componente só do catálogo; o admin cadastra os principais modelos e o atleta sugere novos (RF31, RB15) | **Resolvida** |
| OPEN-09 | Como cada perfil entra no GearLog? O atleta entra pelo Strava (OAuth, RF04) ou tem conta própria com senha (RNF02) e depois vincula o Strava? Como o administrador entra e como alguém vira administrador? | RF04, RF30, RNF02, modelo de domínio | Decisão do João. O baseline implementa só o login do atleta pelo Strava, que cria a conta no primeiro acesso | Aberta |
