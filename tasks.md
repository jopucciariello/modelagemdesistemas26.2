# tasks.md — Tarefas da Fase 1

Tarefas atômicas derivadas do [plan.md](plan.md). Cada uma cita Spec, requisito e issue. `[x]` = feito e no código; `[ ]` = pendente.

## SPEC-001 — Acesso e perfis
- [x] T-01 Login pelo Google com PKCE, `state` e `nonce` — RF04 — #9
- [x] T-02 Perfil por `ADMIN_EMAILS`, reavaliado a cada login e a cada acesso ao `/admin` — RB17 — #9
- [x] T-03 Sessão por cookie com hash do token no banco — RNF02 — #9

## SPEC-002 — Catálogo
- [x] T-04 CRUD de famílias, planos padrão e componentes no `/admin` — RF30 — #3
- [x] T-05 Carga da planilha (`seed.json`) e carga automática com banco vazio — RF30, RF35 — #3 (PR #37, #39)

## SPEC-003 — Bikes e peças
- [x] T-06 Criar, editar e arquivar bike; criar a partir de bike-modelo — RF01, RF35 — #6 (PR #43)
- [x] T-07 Instalar peça do catálogo com planos sugeridos e editáveis — RF02, RF03, RB15, RB16 — #7, #8 (PR #41)
- [x] T-08 Editar instalação de peça e data de montagem — RF01 — #6 (PR #43, #44)
- [ ] T-09 Remover peça cadastrada por engano (sem histórico) — RF02 — #7 [PROPOSTO]

## SPEC-004 — Pedais e fontes
- [x] T-10 Escolher a fonte de pedais — RF32 — #3
- [x] T-11 Vincular Strava com app do atleta (tutorial e OAuth) — RF33 — #3
- [x] T-12 Configurar conector (URL validada contra SSRF, chave criptografada) — RF34, RNF01 — #3
- [x] T-13 Sincronizar histórico inteiro sob demanda (`since`) — RF06, RF13 — #11, #18 (PR #40)
- [x] T-14 Associar bike da fonte, inclusive na criação da bike — RF05 — #10 (PR #41)
- [x] T-15 Lançar e remover pedal manual — RF14 — #19
- [ ] T-16 Atribuir bike a pedal sem `gear_id` sem perder na próxima sincronização — RF05 — #10 (OPEN-20)
- [ ] T-17 Aplicar exclusões vindas do feed de eventos do conector — RF06, RNF05 — #11
- [ ] T-18 Sincronização automática (webhook ou agendada) — RNF05 — #11

## SPEC-005 — Desgaste, alertas e painel
- [x] T-19 Cálculo por plano, limiares e texto do alerta — RF07–RF09, RB02, RB04, RB11–RB14 — #12, #13, #14
- [x] T-20 Painel ordenado por desgaste — RF15 — #20
- [ ] T-22 Painel legível em 390 px (cartões no celular) — RNF07 — #20

## SPEC-006 — Manutenção e histórico
- [x] T-23 Revisão e troca de item por plano — RF10, RB13, RB18 — #15
- [x] T-24 Troca de peça inteira com histórico — RF10, RB05 — #15
- [x] T-25 Manutenção manual e histórico — RF11, RF12 — #16, #17
- [x] T-26 Revisão na oficina com vários itens e condição — RF36 — #3 (PR #42)

## SPEC-007 — Pedido de modelo novo
- [ ] T-27 Entidade e migração `ModelRequest` — RF31 — #3
- [ ] T-28 Menu de ajuda com formulário de pedido — RF31 — #3
- [ ] T-29 Lista e resposta de pedidos no `/admin` — RF31 — #3

## Transversais
- [x] T-30 Deploy pelo GitHub Actions com segredos do Infisical — RNF01 — #3
- [x] T-31 CI com tipos, lint, testes e build em todo PR; testes antes do deploy — RNF08 — #3
- [x] T-32 Documentação da disciplina (spec, plan, tasks, UC, UML, specs, review) — RNF09 — #3
- [ ] T-21 Backup diário do volume do SQLite — RNF06 — #3
- [ ] T-33 Regras de desgaste por fator de uso e recalibração pela medição — RF07 — #38
