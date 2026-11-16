# Specs — GearLog (Fase 1)

Texto completo das Specs do [mapa de Specs](mapa-specs.md), cada uma com as 14 seções do fluxo SDD da disciplina. Invariantes têm IDs globais (`INV-001`…) e cada um aponta para o teste que o verifica.

> **Situação:** SPEC-001 a SPEC-006 foram escritas em 13/11/2026, depois da implementação, e conferidas contra o código (`feat/RF04-baseline`). As divergências encontradas estão na seção 13 de cada Spec e em [review/](review/). Aguardam aprovação do João (OPEN-21). SPEC-007 é a próxima a implementar.

---

## SPEC-001 — Acesso e perfis

**1. Identificação.** Objetivo: identificar quem usa o GearLog e o que pode fazer. Valor: o atleta entra sem criar senha; só pessoas autorizadas mexem no catálogo.

**2. Rastreabilidade.** RF04 · RB17 · RNF02 · UC01 · Usuário, Sessão · drivers: dois perfis, sem senhas · ADR-002, ADR-005.

**3. Escopo.** Incluído: login pelo Google, criação do usuário, perfil Atleta ou Administrador, sessão por cookie, sair. Fora: login por senha, login pelo Strava, papéis de lojista e oficina (Fases 2 e 3).

**4. Dependências.** Nenhuma Spec. Configuração: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `ADMIN_EMAILS` (Infisical).

**5. Comportamento esperado.**
- Pré: nenhuma.
- Fluxo principal: ver UC01 e o [diagrama de sequência 2.2](uml.md#22-entrar-com-google-e-acessar-a-área-administrativa-uc01--uc14).
- Alternativos: usuário já existe → o perfil é recalculado no login (sair da lista rebaixa a Atleta).
- Exceções: `state` diferente, login cancelado, e-mail não verificado, token inválido → sem sessão, erro na página inicial.
- Pós: sessão de 30 dias; o banco guarda só o hash do token.

**6. Regras e invariantes.**
- INV-001: um e-mail não verificado nunca gera sessão. (`google-admin-login.test.ts` › rejects an unverified e-mail)
- INV-002: só e-mails da lista `ADMIN_EMAILS` são Administrador, sem diferenciar maiúsculas. (`activity-sources.test.ts` › makes listed e-mails admin; `google-admin-login.test.ts` › authorizes only listed e-mails)
- INV-003: o acesso de admin é conferido a cada requisição contra a lista atual (RB17). (`getCurrentAdmin`; teste de unidade da lista)
- INV-004: o login exige `state`, `nonce` e PKCE S256. (`google-admin-login.test.ts` › uses the code flow…)

**7. Modelo de domínio.** Usuário (perfil, fonte de pedais), Sessão. Perfil é atributo (`role`), não uma tabela por perfil.

**8. Impacto arquitetural.** Rotas `src/app/auth/google/*`, `src/lib/google/oidc.ts`, `src/lib/session.ts`, `src/lib/guards.ts`.

**9. Contratos.** Entrada: callback do Google (`code`, `state`). Saída: cookie `gearlog_session` (httpOnly, `SameSite=Lax`, `Secure` em produção). Erros: `invalid_state`, `access_denied`, `email_not_verified`, `token_exchange_failed`.

**10. RNFs.** RNF02: não há tabela nem campo de senha (verificável no `schema.prisma`).

**11. Critérios de aceitação.**
- Dado um e-mail verificado fora da lista, quando a pessoa entra, então ela vira Atleta e não abre `/admin`.
- Dado um e-mail da lista, quando entra, então vira Administrador e abre `/admin`.
- Dado um admin logado, quando o e-mail sai da lista, então a próxima requisição a `/admin` é negada.
- Dado um `state` diferente no callback, quando o Google retorna, então nenhuma sessão é criada.

**12. Casos de teste.** `google-admin-login.test.ts` (URL, callback, claims, lista), `activity-sources.test.ts` (perfil pelo e-mail), `crypto.test.ts` (hash do token de sessão).

**13. Questões em aberto.** OPEN-10 (qualquer e-mail vira Atleta) aguarda aprovação. ADR-005 está como "Proposto".

**14. DoD.** Critérios de aceitação passando; testes verdes; ADR-005 aceito; nenhuma senha guardada.

---

## SPEC-002 — Catálogo do administrador

**1. Identificação.** Objetivo: manter o catálogo de famílias, componentes e bikes-modelo. Valor: o atleta escolhe peças reais com intervalos de fonte confiável, sem digitar marca e modelo.

**2. Rastreabilidade.** RF30, RF35 (bikes-modelo) · RB10, RB15, RB17 · UC14 · Família, Plano padrão, Componente, Plano do componente, Bike-modelo, Peça do modelo.

**3. Escopo.** Incluído: CRUD de famílias, planos padrão e componentes; ativar e desativar; carregar a planilha (`seed.json`), também sozinho na primeira subida com banco vazio. Fora: edição de bike-modelo pela tela; pedidos de atletas (SPEC-007).

**4. Dependências.** SPEC-001 (perfil Administrador).

**5. Comportamento esperado.**
- Pré: admin autorizado (INV-003).
- Fluxo principal: UC14.
- Alternativos: recarregar a planilha atualiza componentes e bikes-modelo pelo código, sem duplicar.
- Exceções: família com nome repetido → recusada; plano sem intervalo → ignorado.
- Pós: o catálogo vale para novas peças; peças instaladas mantêm os planos copiados.

**6. Regras e invariantes.**
- INV-005: códigos de componente são únicos e pertencem a famílias conhecidas. (`catalog.test.ts` › has unique codes in known categories)
- INV-006: todo plano tem intervalo em km ou em horas (RB10). (`catalog.test.ts` › gives every plan at least one interval)
- INV-007: toda bike-modelo aponta para componentes existentes. (`catalog.test.ts` › points every bike model to existing components)
- INV-008: o intervalo é a média da faixa e o amarelo é o mínimo (OPEN-17). (`catalog.test.ts` › uses the average of the range…)

**7. Modelo de domínio.** Ver [dominio.md](dominio.md). Família agrega componentes (eles sobrevivem a uma família desativada); componente compõe os seus planos.

**8. Impacto arquitetural.** `src/app/admin/`, `src/components/admin-catalog.tsx`, `src/app/actions/catalog.ts`, `src/lib/catalog/{seed.json,seed.ts,load.ts,rules.ts}`, `src/instrumentation.ts`.

**9. Contratos.** Formulários do admin (server actions). Planilha: `seed.json` com `categories`, `components` (por `code`) e `bikeModels` (por `code`, com `parts[{position, code}]`).

**10. RNFs.** —

**11. Critérios de aceitação.**
- Dado um banco sem catálogo, quando o servidor sobe, então 7 famílias, 250 componentes e 17 bikes-modelo existem.
- Dado o catálogo carregado, quando o admin carrega a planilha de novo, então não há componentes duplicados.
- Dado um Atleta, quando ele tenta uma ação do catálogo, então ela é negada.

**12. Casos de teste.** `catalog.test.ts` (seed e regras). Ponta a ponta manual: carga na subida e recarga sem duplicar (registrada no PR #39).

**13. Questões em aberto.** Nenhuma. Divergência: o admin não edita bike-modelo pela tela (só pela planilha); aceito por enquanto.

**14. DoD.** Critérios passando; seed testado; admin protegido por INV-003.

---

## SPEC-003 — Bikes e peças

**1. Identificação.** Objetivo: o atleta registra as bikes e as peças instaladas. Valor: base para acompanhar o desgaste de cada peça.

**2. Rastreabilidade.** RF01, RF02, RF03, RF35 · RB01, RB10, RB15, RB16 · RNF07 · UC03, UC04, UC05 · Bike, Peça, Plano de manutenção.

**3. Escopo.** Incluído: criar (à mão ou de bike-modelo), editar, arquivar e reativar bike; data de montagem; instalar peça do catálogo com posição, data, uso inicial e planos editáveis; editar a instalação de uma peça. Fora: apagar bike; peça fora do catálogo.

**4. Dependências.** SPEC-002.

**5. Comportamento esperado.** UC03, UC04 e UC05.
- Exceções: modelo inexistente; data de montagem no futuro ou depois da troca de uma peça original; componente de outra família; plano sem intervalo quando o catálogo tem planos.
- Pós: peças com planos copiados; o desgaste conta a partir da instalação.

**6. Regras e invariantes.**
- INV-009: os planos de uma peça nova vêm do componente ou, sem eles, da família; sem nenhum, a peça não tem desgaste regular (RF03, RB16). (`catalog.test.ts` › plans of a new part)
- INV-010: o atleta só instala componentes ativos do catálogo (RB15). (`createPart`)
- INV-011: mudar a data de montagem move só as peças originais. (PR #44, ponta a ponta)
- INV-012: todo acesso a bike, peça e plano filtra pelo dono da sessão. (`ownBike`, `ownPart`)

**7. Modelo de domínio.** Bike compõe Peças; Peça compõe Planos de manutenção e referencia um Componente.

**8. Impacto arquitetural.** `src/app/bikes/**`, `src/app/actions/bikes.ts` (`createBike`, `updateBike`, `updatePart`, `createPart`, `updatePlan`, `toggleArchiveBike`), `src/lib/forms.ts`.

**9. Contratos.** Formulários; datas como dia de São Paulo (`YYYY-MM-DD`). Erros por código na URL (`?erro=`).

**10. RNFs.** RNF07: telas usáveis em 390 px. Achado: o seletor de modelo estoura a largura (ver [review/desempenho-e-usabilidade.md](review/desempenho-e-usabilidade.md)).

**11. Critérios de aceitação.**
- Dado um modelo do catálogo e a data 15/01/2024, quando o atleta cria a bike, então todas as peças originais aparecem instaladas em 15/01/2024 com os planos sugeridos.
- Dada uma peça trocada em 01/01/2025, quando o atleta muda a montagem para 01/06/2023, então só as peças originais mudam.
- Dada uma bike de outro atleta, quando alguém tenta editá-la, então nada muda.

**12. Casos de teste.** `catalog.test.ts`, `rides-map.test.ts` (leitura de formulários e datas). Ponta a ponta: PR #41, #43, #44.

**13. Questões em aberto.** Remover peça cadastrada por engano (hoje só "trocar") — proposta em `review/`.

**14. DoD.** Critérios passando; sem regressão nos testes de unidade.

---

## SPEC-004 — Pedais e fontes

**1. Identificação.** Objetivo: trazer os pedais do atleta para o GearLog. Valor: km e horas atualizados sem digitação, e o app funciona mesmo sem Strava.

**2. Rastreabilidade.** RF05, RF06, RF13, RF14, RF32, RF33, RF34 · RB02, RB03, RB08, RB12 · RNF01, RNF05, RNF06 · UC02, UC06, UC07 · Pedal, Conexão Strava, Conexão conector · ADR-003, ADR-006.

**3. Escopo.** Incluído: escolher a fonte; vincular Strava com app próprio; configurar conector; sincronizar sob demanda; lançar e remover pedal manual; associar bike da fonte. Fora (pendente): sincronização automática, webhooks, exclusões vindas do Strava, atribuir bike a pedal sem `gear_id` (OPEN-20).

**4. Dependências.** SPEC-001, SPEC-003.

**5. Comportamento esperado.** UC02, UC06, UC07 e [sequência 2.1](uml.md#21-sincronizar-pedais-pelo-conector-recalcular-o-desgaste-e-emitir-alerta-uc06--uc08).

**6. Regras e invariantes.**
- INV-013: só os seis tipos de ciclismo entram (RB03). (`wear.test.ts` › ignores non-cycling activities; `rides-map.test.ts` › keeps cycling rides and drops invalid items)
- INV-014: horas = tempo em movimento; metros e segundos do Strava viram km e horas (RB12). (`rides-map.test.ts` › converts to km and moving hours)
- INV-015: sincronizar de novo não duplica pedais (único por atleta + id externo). (esquema `@@unique([userId, externalId])`)
- INV-016: falha na fonte não altera dados guardados e registra só o código do erro (RF13). (`syncRides`; `activity-sources.test.ts` › maps 401, 5xx… without leaking the key)
- INV-017: a URL do conector é `https` e não aponta para rede privada. (`activity-sources.test.ts` › connector URL (SSRF))
- INV-018: o conector recebe `since` e devolve o histórico inteiro. (`activity-sources.test.ts` › asks /activities for the whole history…)
- INV-019: segredos (Client Secret, tokens, chave do conector) ficam criptografados e nunca vão ao navegador (RNF01). (`crypto.test.ts`)

**7. Modelo de domínio.** Pedal pertence ao atleta e, opcionalmente, a uma bike (agregação). Conexões são 0..1 por usuário.

**8. Impacto arquitetural.** `src/app/fonte/**`, `src/app/pedais/`, `src/app/actions/rides.ts`, `src/lib/rides/{sync,map}.ts`, `src/lib/connector/*`, `src/lib/strava/*`, `src/lib/crypto.ts`.

**9. Contratos.** Conector: `GET /v1/gearlog/status | bikes | activities?since=<ISO>` com `Authorization: Bearer`. Strava: `GET /athlete`, `GET /athlete/activities?after&page&per_page=100`. Erros mapeados: `not_linked`, `unreachable`, `unauthorized`, `bad_response`, `unexpected`.

**10. RNFs.** RNF05: no máximo 10 páginas por sincronização no Strava (parcial; sem webhook). RNF06: sem fonte, o lançamento manual e as telas continuam.

**11. Critérios de aceitação.**
- Dado o conector configurado, quando o atleta sincroniza, então todos os pedais de ciclismo do histórico entram uma vez só.
- Dada uma bike associada ao gear `b123`, quando um pedal desse gear chega, então ele entra nessa bike.
- Dado o conector fora do ar, quando o atleta sincroniza, então aparece o erro e os pedais anteriores continuam.
- Dada uma bike montada do zero e já pedalada 120 km no Strava antes do cadastro, quando o atleta associa a bike da fonte marcando "montada do zero", então as peças originais passam a valer desde o primeiro pedal e os 120 km contam no desgaste.
- Dada a fonte manual, quando o atleta lança 40 km e 1,5 h, então o pedal aparece e conta para as peças instaladas na data.

**12. Casos de teste.** `rides-map.test.ts`, `activity-sources.test.ts`, `strava-oauth.test.ts`, `crypto.test.ts`.

**13. Questões em aberto.** OPEN-10, OPEN-11, OPEN-12, OPEN-20. RF32–RF34 e ADR-006 marcados como propostos. Divergência com RNF05: webhook pendente.

**14. DoD.** Critérios passando; nenhum segredo em log; erro de fonte não apaga dados.

---

## SPEC-005 — Desgaste, alertas e painel

**1. Identificação.** Objetivo: calcular o desgaste de cada plano e avisar antes do fim. Valor: o atleta sabe o que trocar e quando.

**2. Rastreabilidade.** RF07, RF08, RF09, RF15 · RB02, RB04, RB11, RB13, RB14, RB16 · RNF04, RNF07, RNF08 · UC08 · Plano de manutenção, Pedal · ADR-007.

**3. Escopo.** Incluído: cálculo por plano; status ok, próximo e necessário; texto por ação; painel ordenado; barra na página da bike. Fora: push e e-mail (OPEN-14); fatores de uso como lama e peso (issue #38).

**4. Dependências.** SPEC-003, SPEC-004.

**5. Comportamento esperado.** UC08. Pós: nada é gravado; cada leitura recalcula.

**6. Regras e invariantes.**
- INV-020: só contam pedais entre o início do plano (última revisão ou instalação) e a remoção da peça (RB02). (`wear.test.ts` › only rides while the part was installed count)
- INV-021: `VirtualRide` só conta para famílias "desgasta em rolo" (RB14). (`wear.test.ts` › counts VirtualRide only…)
- INV-022: desgaste = maior fração entre km e horas (RB11). (`wear.test.ts` › takes the metric reached first)
- INV-023: amarelo a partir do mínimo da faixa ou de 80%; vermelho em 100% (RB04). (`wear.test.ts` › yellow from the minimum…; classifies thresholds)
- INV-024: o texto do alerta segue a ação: "Troca" ou "Revisão" (RB13). (`wear.test.ts` › words the alert by the plan's action)
- INV-025: o uso inicial soma só até a primeira revisão do plano. (`wear.test.ts` › counts from the last service and drops the initial usage)
- INV-026: o painel ordena do mais gasto ao menos gasto (RF15). (`wear.test.ts` › sorts by wear)

**7. Modelo de domínio.** O desgaste é derivado, não persistido (ADR-007).

**8. Impacto arquitetural.** `src/lib/wear.ts` (puro), `src/lib/tracker.ts` (leitura), `src/app/page.tsx`, `src/components/ui.tsx` (`WearMeter`).

**9. Contratos.** `computePlanWear(part, plan, rides) → { km, hours, ratio, status, alert }`.

**10. RNFs.** RNF08: `wear.ts` não importa banco nem UI e é testado com Node puro. RNF04: o painel lê os pedais do atleta a cada acesso; ver [review/desempenho-e-usabilidade.md](review/desempenho-e-usabilidade.md). RNF07: no celular, a tabela do painel corta a coluna de desgaste (achado aberto).

**11. Critérios de aceitação.**
- Dado um plano de corrente de 2.250 km com amarelo em 1.500 km, quando o uso chega a 1.500 km, então aparece "Troca próxima"; em 2.250 km, "Troca necessária".
- Dado um plano de suspensão em horas, quando chega a 100%, então aparece "Revisão necessária".
- Dado um `VirtualRide` de 30 km, quando o painel é aberto, então ele soma à transmissão e não aos pneus.

**12. Casos de teste.** `wear.test.ts` (todas as INV acima).

**13. Questões em aberto.** Issue #38 (fatores de uso e medição real). Achado de RNF07 no celular.

**14. DoD.** Todas as INV com teste verde; nenhuma importação de banco em `wear.ts`.

---

## SPEC-006 — Manutenção e histórico

**1. Identificação.** Objetivo: registrar o que foi feito na bike e recomeçar os planos certos. Valor: histórico confiável e contadores que refletem a realidade.

**2. Rastreabilidade.** RF10, RF11, RF12, RF36 · RB05, RB13, RB16, RB18 · RNF09 · UC09–UC13 · Evento de manutenção, Revisão na oficina, Peça.

**3. Escopo.** Incluído: revisão/troca de item; troca de peça inteira; manutenção manual; revisão na oficina com vários itens e condição; histórico. Fora: níveis de revisão das oficinas (Fase 3); apagar eventos.

**4. Dependências.** SPEC-005.

**5. Comportamento esperado.** UC09–UC13 e [sequência 2.3](uml.md#23-registrar-revisão-na-oficina-com-vários-itens-uc12).

**6. Regras e invariantes.**
- INV-027: só zera um plano isolado se a ação for revisão ou se a peça tiver mais de um plano (RB13, RB18). (`catalog.test.ts` › allows a service, or a replacement inside a multi-plan part)
- INV-028: zerar um plano não mexe nos outros da mesma peça. (`wear.test.ts` › keeps the other plan of the same part counting)
- INV-029: a peça trocada fica com `removidaEm` e não é apagada; a nova herda os planos zerados (RF10, RB05, OPEN-16). (`replacePart`)
- INV-030: na revisão na oficina, item fora do catálogo nunca zera contador. (`visit.test.ts` › never resets a counter for a free item)
- INV-031: a revisão na oficina grava tudo numa transação: ou todos os itens, ou nenhum. (`recordShopVisit`)

**7. Modelo de domínio.** Revisão na oficina compõe eventos; evento referencia opcionalmente a peça.

**8. Impacto arquitetural.** `src/app/actions/bikes.ts` (`servicePlan`, `replacePart`, `addManualMaintenance`, `recordShopVisit`), `src/lib/visit.ts`, página da bike.

**9. Contratos.** Formulário da visita: `date`, `shop`, `note`, `<linha>_act ∈ {check, reset, replace}`, `<linha>_cond ∈ {GOOD, WATCH, REPLACE_SOON}`, `<linha>_note`, `free_<i>_label`.

**10. RNFs.** RNF09: cada evento guarda a peça e, se veio de visita, a oficina.

**11. Critérios de aceitação.**
- Dado um grupo com corrente e cassete, quando o atleta troca só a corrente, então só a corrente volta a 0%.
- Dada uma revisão na oficina com suspensão revisada, pneu trocado e movimento central "trocar em breve", quando o atleta registra, então o histórico mostra os três itens com a oficina e a condição.
- Dada uma peça trocada, quando o atleta abre o histórico, então a peça antiga aparece em "Peças trocadas".

**12. Casos de teste.** `catalog.test.ts`, `wear.test.ts`, `visit.test.ts`. Ponta a ponta: PR #42.

**13. Questões em aberto.** Medição real recalibrar o desgaste (issue #38).

**14. DoD.** Critérios passando; transação única por visita.

---

## SPEC-007 — Pedido de modelo novo (a implementar)

**1. Identificação.** Objetivo: o atleta pede o que falta no catálogo sem cadastrar nada. Valor: o catálogo cresce com o que os atletas usam, e a qualidade continua com o admin.

**2. Rastreabilidade.** RF31 · RB15 · UC15 · Pedido de modelo (nova entidade: autor, tipo, texto, status, resposta).

**3. Escopo.** Incluído: menu de ajuda com formulário; lista de pedidos no admin; responder ou marcar como cadastrado. Fora: e-mail ou push.

**4. Dependências.** SPEC-002, SPEC-003.

**5. Comportamento esperado.** UC15. Exceção: texto vazio → recusado.

**6. Regras e invariantes.** INV-032: o pedido nunca cria componente sozinho; só o admin cadastra (RB15).

**7. Modelo de domínio.** Nova entidade `PedidoDeModelo` ligada ao Usuário (decisão de modelo físico na implementação).

**8. Impacto arquitetural.** Nova página ou modal de ajuda, nova seção no admin, uma migração.

**9. Contratos.** Formulário: tipo (componente ou bike), família, texto livre. Status: aberto, cadastrado, recusado.

**10. RNFs.** RNF07.

**11. Critérios de aceitação.**
- Dado um atleta, quando envia um pedido, então ele aparece no admin como "aberto".
- Dado um pedido aberto, quando o admin responde, então o atleta vê a resposta no menu de ajuda.

**12. Casos de teste.** A escrever junto com a implementação.

**13. Questões em aberto.** Onde o atleta vê a resposta (menu de ajuda ou painel)?

**14. DoD.** Critérios passando; migração aplicada; testes.


---

## SPEC-011 — Oficinas e horários (Fase 3)

**1. Identificação.** Objetivo: a oficina tem perfil, serviços e horários; o admin a cadastra. Valor: base para o atleta agendar.

**2. Rastreabilidade.** RF25 · RB21 · UC19, UC20 · Entidades `Workshop`, `WorkshopService`, `WorkshopSlot` · ADR-009.

**3. Escopo.** Incluído: cadastro da oficina pelo admin (nome e e-mail do responsável); o responsável edita perfil, serviços (com itens incluídos) e horários avulsos. Fora: calendário recorrente, pagamento, avaliações.

**4. Dependências.** SPEC-001.

**5. Comportamento esperado.** UC19, UC20. Exceções: e-mail que não é de oficina → `/oficina` nega; horário no passado ou duplicado → recusado.

**6. Regras e invariantes.** INV-060: só o responsável (e-mail da oficina ativa) edita a oficina (RB21). INV-061: horário no passado não é criado.

**7. Modelo de domínio.** Oficina 1–N Serviço, 1–N Horário.

**8. Impacto arquitetural.** Migração aditiva; novas páginas `/oficina`; seção no `/admin`.

**9. Contratos.** Formulários de oficina, serviço (nome, descrição, itens um por linha) e horário (data e hora, fuso de São Paulo).

**10. RNFs.** RNF07 (celular).

**11. Critérios de aceitação.**
- Dado um admin, quando cadastra uma oficina com e-mail, então quem entra com esse e-mail acessa `/oficina`.
- Dado o responsável, quando cadastra um serviço e um horário futuro, então eles aparecem para os atletas.
- Dado outro usuário, quando abre `/oficina`, então é negado.

**12. Casos de teste.** `workshop.test.ts`: leitura dos itens do serviço, validação de horário.

**13. Questões em aberto.** OPEN-40, OPEN-41, OPEN-44.

**14. DoD.** Critérios passando; migração aplicada; testes; documentos atualizados.

## SPEC-012 — Agendamento de revisão (Fase 3)

**1. Identificação.** Objetivo: o atleta agenda e cancela revisões. Valor: a oficina recebe o cliente já com contexto.

**2. Rastreabilidade.** RF26, RF27, RF29 · RB09, RB22 · UC21, UC22 · Entidades `Appointment`, `WorkshopNotice` · ADR-009.

**3. Escopo.** Incluído: listar oficinas e horários livres; agendar com bike e serviço; aviso de compartilhamento; cancelar; aviso à oficina (urgente se < 24 h). Fora: reagendar, e-mail, pagamento.

**4. Dependências.** SPEC-003, SPEC-011.

**5. Comportamento esperado.** UC21, UC22. Exceções: horário já ocupado ou passado → recusado; bike de outro usuário → recusado.

**6. Regras e invariantes.** INV-062: um horário tem no máximo um agendamento ativo (RB22). INV-063: cancelar libera o horário. INV-064: cancelamento com menos de 24 h gera aviso urgente (RF29).

**7. Modelo de domínio.** Agendamento liga Atleta, Bike, Oficina, Horário e Serviço; estado agendado, concluído ou cancelado.

**8. Impacto arquitetural.** Migração aditiva; páginas `/oficinas` e `/agendamentos`; regras puras em `src/lib/workshop.ts`.

**9. Contratos.** Agendar: oficina, horário, bike, serviço. Cancelar: agendamento.

**10. RNFs.** RNF07.

**11. Critérios de aceitação.**
- Dado um horário livre, quando o atleta agenda, então o horário deixa de aparecer como livre.
- Dado um agendamento a menos de 24 h, quando o atleta cancela, então a oficina vê um aviso urgente.
- Dado um cancelamento, então o horário volta a ficar livre.

**12. Casos de teste.** `workshop.test.ts`: `isLateCancellation`, `canBook`.

**13. Questões em aberto.** OPEN-42, OPEN-43.

**14. DoD.** Critérios passando; migração aplicada; testes.

## SPEC-013 — Histórico compartilhado e conclusão do serviço (Fase 3)

**1. Identificação.** Objetivo: a oficina vê o histórico da bike agendada e registra o serviço feito. Valor: o atleta fica com o histórico atualizado sem digitar.

**2. Rastreabilidade.** RF27, RF28 · RNF03 · RB09 · UC23, UC24 · `ServiceVisit`, `MaintenanceEvent` (RF36) · ADR-009.

**3. Escopo.** Incluído: página do atendimento com bike, peças e histórico (leitura); conclusão com itens e peças trocadas, que grava visita no histórico da bike. Fora: edição de bike pela oficina, fotos, orçamento.

**4. Dependências.** SPEC-006, SPEC-012.

**5. Comportamento esperado.** UC23, UC24. Exceção: agendamento cancelado ou de outra oficina → acesso negado.

**6. Regras e invariantes.** INV-065: oficina só lê bike com agendamento ativo ou concluído com ela (RB09, RNF03). INV-066: concluir grava uma única visita e muda o agendamento para concluído; concluir duas vezes é recusado. INV-067: gravar a visita segue as regras da RF36 (RB13, RB18).

**7. Modelo de domínio.** `Appointment.visitId` aponta a visita gerada.

**8. Impacto arquitetural.** Extração de `recordVisit` de `src/app/actions/bikes.ts` para `src/lib/visit-record.ts`, usada também pela oficina.

**9. Contratos.** Concluir: agendamento, data, itens (formato RF36).

**10. RNFs.** RNF03, RNF07.

**11. Critérios de aceitação.**
- Dado um agendamento ativo, quando a oficina abre o atendimento, então vê peças e histórico da bike.
- Dado um agendamento cancelado, quando a oficina tenta abrir, então é negado.
- Dado um atendimento concluído, então o histórico da bike mostra a visita com o nome da oficina.

**12. Casos de teste.** `workshop.test.ts`: `canWorkshopAccessBike` para cada estado; `visit.test.ts` (já existente) cobre a leitura dos itens.

**13. Questões em aberto.** OPEN-42, OPEN-44.

**14. DoD.** Critérios passando; migração aplicada; testes; Fase 1 sem regressão.
