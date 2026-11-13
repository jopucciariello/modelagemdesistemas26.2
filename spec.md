# spec.md — GearLog (Fase 1)

**Fonte de verdade do projeto.** Este arquivo reúne o que o GearLog deve fazer e aponta para o detalhe em `docs/`. Quando código e spec divergirem, vale a spec, e a divergência vira `OPEN-XX` em [decisoes-em-aberto.md](docs/decisoes-em-aberto.md). Regras do processo: [CLAUDE.md](CLAUDE.md) (constituição).

Plano técnico: [plan.md](plan.md). Tarefas: [tasks.md](tasks.md).

## 1. Visão

Ciclistas não sabem quanto cada peça da bike já gastou e só descobrem na quebra. O GearLog soma os km e as horas dos pedais (lançados à mão, pelo Strava do atleta ou pelo conector dele) às peças instaladas e avisa antes da troca ou da revisão. Um administrador mantém o catálogo de componentes com intervalos de referência.

- Escopo da entrega: **Fase 1, tracker de desgaste**, só bicicletas. Detalhe em [visao.md](docs/visao.md).
- Fora: mercado de peças e oficinas (Fases 2 e 3, em [segundo-estagio.md](docs/segundo-estagio.md)).

## 2. Personas e perfis

| Persona | Perfil | Precisa de |
|---|---|---|
| Rafael | Atleta | Saber o que trocar e quando, sem planilha; registrar o que a oficina fez |
| Beatriz | Administradora | Manter um catálogo confiável de componentes e bikes-modelo |

Detalhe e matriz persona × funcionalidade: [personas.md](docs/personas.md). Os dois perfis entram pelo Google; Administrador é quem está em `ADMIN_EMAILS` (RB17).

## 3. Requisitos

Texto completo em EARS: [requisitos.md](docs/requisitos.md). Resumo da Fase 1:

| Grupo | IDs |
|---|---|
| Bikes e peças | RF01, RF02, RF03, RF35 |
| Acesso | RF04 |
| Pedais e fontes | RF05, RF06, RF13, RF14, RF32, RF33, RF34 |
| Desgaste e alertas | RF07, RF08, RF09, RF15 |
| Manutenção | RF10, RF11, RF12, RF36 |
| Catálogo | RF30, RF31 |
| Não funcionais | RNF01, RNF02, RNF04–RNF09 |
| Regras de negócio | RB01–RB05, RB08, RB10–RB18 |

## 4. Backlog priorizado

Issue épica: [#3](https://github.com/jopucciariello/modelagemdesistemas26.2/issues/3). Prioridade MoSCoW conforme `requisitos.md`.

| Ordem | Item | Requisitos | Issue | Situação |
|---|---|---|---|---|
| 1 | Login pelo Google e perfis | RF04, RB17 | #9 | Feito |
| 2 | Catálogo do admin e carga da planilha | RF30, RF35 | #3 | Feito |
| 3 | Bikes, peças e planos | RF01–RF03 | #6, #7, #8 | Feito |
| 4 | Fonte de pedais, Strava próprio, conector | RF32–RF34, RF05 | #10 | Feito |
| 5 | Pedais manuais e sincronização | RF06, RF13, RF14 | #11, #18, #19 | Feito (sincronização manual) |
| 6 | Desgaste, alertas e painel | RF07–RF09, RF15 | #12, #13, #14, #20 | Feito |
| 7 | Troca, revisão, manutenção e histórico | RF10–RF12 | #15, #16, #17 | Feito |
| 8 | Revisão na oficina com vários itens | RF36 | #3 | Feito |
| 9 | Pedido de modelo novo pelo menu de ajuda | RF31 | #3 | Pendente |
| 10 | Sincronização automática (webhook do conector) | RNF05 | #3 | Pendente |

## 5. Casos de uso

UC01–UC15 com diagrama, atores, fluxos e exceções: [casos-de-uso.md](docs/casos-de-uso.md).

## 6. Domínio

Modelo conceitual: [dominio.md](docs/dominio.md). Classes e sequências: [uml.md](docs/uml.md). Termos: [glossario.md](docs/glossario.md).

## 7. Specs (fatias verticais)

Mapa ordenado: [mapa-specs.md](docs/mapa-specs.md). Texto com as 14 seções e invariantes INV-001…INV-032: [specs.md](docs/specs.md).

| Spec | Nome | Situação |
|---|---|---|
| SPEC-001 | Acesso e perfis | Implementada, aguarda aprovação (OPEN-21) |
| SPEC-002 | Catálogo do administrador | Implementada, aguarda aprovação |
| SPEC-003 | Bikes e peças | Implementada, aguarda aprovação |
| SPEC-004 | Pedais e fontes | Implementada, aguarda aprovação |
| SPEC-005 | Desgaste, alertas e painel | Implementada, aguarda aprovação |
| SPEC-006 | Manutenção e histórico | Implementada, aguarda aprovação |
| SPEC-007 | Pedido de modelo novo | A implementar |

## 8. Decisões e questões em aberto

- Arquitetura e ADRs: [arquitetura.md](docs/arquitetura.md), [docs/adr/](docs/adr/).
- Questões em aberto: [decisoes-em-aberto.md](docs/decisoes-em-aberto.md).
- Revisão multidimensional: [docs/review/](docs/review/).
