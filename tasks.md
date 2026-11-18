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
- [x] T-22 Painel legível em 390 px (cartões no celular) — RNF07 — #20

## SPEC-006 — Manutenção e histórico
- [x] T-23 Revisão e troca de item por plano — RF10, RB13, RB18 — #15
- [x] T-24 Troca de peça inteira com histórico — RF10, RB05 — #15
- [x] T-25 Manutenção manual e histórico — RF11, RF12 — #16, #17
- [x] T-26 Revisão na oficina com vários itens e condição — RF36 — #3 (PR #42)

## SPEC-007 — Pedido de modelo novo
- [x] T-27 Entidade e migração `ModelRequest` — RF31 — #3
- [x] T-28 Menu de ajuda com formulário de pedido — RF31 — #3
- [x] T-29 Lista e resposta de pedidos no `/admin` — RF31 — #3

## Transversais
- [x] T-30 Deploy pelo GitHub Actions com segredos do Infisical — RNF01 — #3
- [x] T-31 CI com tipos, lint, testes e build em todo PR; testes antes do deploy — RNF08 — #3
- [x] T-32 Documentação da disciplina (spec, plan, tasks, UC, UML, specs, review) — RNF09 — #3
- [ ] T-21 Backup diário do volume do SQLite — RNF06 — #3
- [ ] T-33 Regras de desgaste por fator de uso e recalibração pela medição — RF07 — #38

# Fase 2 — Mercado de peças (tentativa de entrega; a Fase 1 não depende dela)

## SPEC-008 — Anúncios e vitrine
- [x] T-40 Migração e modelos `Merchant`, `Listing`, `Dream`, `Notification` — ADR-008 — #4
- [x] T-41 Publicar, editar, marcar como vendido e encerrar anúncio próprio — RF16, RB07, RB19 — #21
- [x] T-42 Vitrine com filtros de família, condição, preço e tipo de vendedor — RF17 — #22
- [x] T-43 Página do anúncio com contato do vendedor para usuário logado — RB20 — #22

## SPEC-009 — Sonhos e notificações
- [x] T-44 CRUD de sonhos — RF20 — #25
- [x] T-45 Função pura de compatibilidade sonho × anúncio, com teste — RF21 — #26
- [x] T-46 Notificar o dono do sonho ao publicar anúncio compatível — RF21 — #26
- [x] T-47 Sino de notificações dentro do app, marcar como lida — RF21, OPEN-34 — #26
- [x] T-48 Notificar lojistas verificados da família ao cadastrar sonho — RF22 — #27
- [x] T-49 Sugerir anúncios no alerta de troca próxima — RF23 — #28

## SPEC-010 — Lojistas, selo e moderação
- [x] T-50 Admin cadastra lojista, concede e revoga selo — RF18, RB06 — #23
- [x] T-51 Selo nos anúncios e na vitrine do lojista — RF19 — #24
- [x] T-52 Admin remove anúncio com motivo — RF24 — #29

## Fase 3 — Oficina (tentativa a partir de 16/11/2026; só depois de a Fase 1 estar funcional)
- [x] T-60 Migração e entidades `Workshop`, `WorkshopService`, `WorkshopSlot`, `Appointment`, `WorkshopNotice` — RF25 — #5
- [x] T-61 Admin cadastra oficina com o e-mail do responsável — RF25, RB21 — #5
- [x] T-62 Área `/oficina`: perfil, serviços com itens e horários — RF25 — #5
- [x] T-63 Atleta lista oficinas e agenda com bike e serviço — RF26, RB22 — #5
- [x] T-64 Cancelar agendamento e avisar a oficina (urgente < 24 h) — RF29 — #5
- [x] T-65 Regra `canWorkshopAccessBike` e página do atendimento só leitura — RF27, RNF03, RB09 — #5
- [x] T-66 Extrair `recordVisit` e concluir o serviço no histórico da bike — RF28, RF36 — #5
- [x] T-70 Migração M2 e regras puras: grade semanal, duração, distância, etapas, consentimento, equipe — RF25, RF26, RF27, RB21, RB23 — #69 #70
- [x] T-71 Pedido de cadastro de oficina e aprovação do admin — RF25 — #30
- [x] T-72 Responsável convida mecânicos por e-mail — RF25, RB21 — #30
- [x] T-73 Oficinas próximas por distância e horários livres pela grade — RF25, RF26 — #69 #31
- [x] T-74 Agendar com escolha de compartilhar histórico — RF26, RF27, RB09 — #31 #32
- [x] T-75 Cancelamento com aviso por e-mail — RF29, RF38 — #34
- [x] T-76 Concluir OS avança meta de revisão em etapas — RF28, RB23 — #33
- [x] T-77b API do back-office da oficina (perfil, serviços, grade, mecânicos) e da fila do admin — RF25, RB21, RB17 — #70 #71
- [x] T-77a API HTTP de oficinas e agenda com token (`/api/v1/oficinas`) — RF25–RF29 — #71
- [ ] T-77 Telas Expo de oficina e agenda — RF25–RF29 — #71
