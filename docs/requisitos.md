# Especificação de Requisitos — GearLog

Os requisitos funcionais seguem o padrão **EARS** (*Easy Approach to Requirements Syntax*):

| Padrão | Modelo |
|---|---|
| Ubíquo | O sistema deve `<resposta>`. |
| Orientado a evento | Quando `<gatilho>`, o sistema deve `<resposta>`. |
| Orientado a estado | Enquanto `<estado>`, o sistema deve `<resposta>`. |
| Comportamento indesejado | Se `<condição indesejada>`, então o sistema deve `<resposta>`. |
| Opcional | Onde `<recurso estiver presente>`, o sistema deve `<resposta>`. |

Prioridade (MoSCoW): **M** = Must, **S** = Should, **C** = Could.

---

## 1. Requisitos Funcionais

### Fase 1 — Tracker de desgaste (escopo da entrega)

> Os requisitos da Fase 2 (RF16–RF24, RB06, RB07) estão em [segundo-estagio.md](segundo-estagio.md). Em 16/11/2026 João decidiu tentar implementar também as Fases 2 e 3, depois que a Fase 1 estiver funcional. Os da Fase 3 (RF25–RF29, RNF03, RB09) estão na seção abaixo.

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF01 | O sistema deve permitir que o atleta cadastre, edite, aposente (arquive) e exclua bicicletas (nome, tipo, marca, modelo, ano) e envie uma foto de cada uma (JPEG, PNG ou WebP, até 1 MB; sem foto, aparece um ícone). A exclusão apaga a bike, as peças e o histórico e exige confirmação; os pedais importados da fonte permanecem guardados sem bike, e a exclusão é recusada enquanto houver agendamento em oficina. | M |
| RF02 | O sistema deve permitir que o atleta cadastre peças em uma bike, escolhendo a família e o componente do catálogo (RF30) e informando posição na bike (opcional), data de instalação, uso inicial (km e/ou horas) e os planos de manutenção da peça (RB16). Os planos sugeridos são os do componente ou, se ele não tiver, os da família. *(Alterado em 12/11/2026.)* | M |
| RF03 | Quando o atleta cadastrar uma peça sem informar vida útil, o sistema deve sugerir a vida útil padrão da categoria. | S |
| RF04 | Quando o usuário entrar com a conta Google (OpenID Connect), o sistema deve criar ou localizar o seu perfil: Administrador, se o e-mail verificado estiver em `ADMIN_EMAILS` (RB17), ou Atleta, nos demais casos. **[PROPOSTO]** *(Alterado em 12/11/2026; antes vinculava a conta Strava via OAuth 2.0. O vínculo com o Strava passa a ser a fonte B do RF32.)* | M |
| RF05 | Quando a fonte de pedais do atleta for o Strava (API própria, RF33) ou o conector (RF34), o sistema deve listar as bikes dessa fonte para associá-las às bikes do GearLog. Quando o atleta indicar que a bike foi montada do zero, o sistema deve usar a data do primeiro pedal da bike da fonte como data de montagem das peças originais, para que o histórico anterior ao cadastro conte no desgaste. | M |
| RF06 | Quando uma nova atividade de ciclismo chegar pela fonte do atleta (Strava ou conector), o sistema deve somar a distância (km) e o tempo em movimento (horas) da atividade à bike associada e às peças instaladas nela. | M |
| RF07 | O sistema deve calcular o desgaste de cada plano de manutenção da peça como percentual do intervalo consumido, em km e em horas, considerando o maior dos dois percentuais quando o plano tiver as duas métricas. | M |
| RF08 | Quando o uso de um plano da peça atingir o mínimo da faixa de durabilidade do catálogo (ou 80% do intervalo, se o plano não tiver mínimo), o sistema deve emitir um alerta de "troca próxima" ou, para peças cuja ação é revisão (RB13), de "revisão próxima". | M |
| RF09 | Quando o desgaste de uma peça atingir 100%, o sistema deve emitir um alerta de "troca necessária" ou, para peças cuja ação é revisão (RB13), de "revisão necessária". | M |
| RF10 | Quando o atleta registrar a troca de uma peça, o sistema deve encerrar a peça antiga, registrá-la no histórico e iniciar a nova com km e horas zerados. | M |
| RF11 | O sistema deve exibir o histórico de manutenção de cada bike em ordem cronológica. | M |
| RF12 | O sistema deve permitir que o atleta registre manutenção manual (ex.: lubrificação, sangria de freio) sem troca de peça. | S |
| RF13 | Se a sincronização com a fonte (Strava ou conector) falhar, então o sistema deve manter os dados anteriores, registrar a falha e permitir nova tentativa manual. | M |
| RF14 | Onde a fonte de pedais do atleta for manual (RF32), o sistema deve permitir que o atleta lance cada pedal à mão, com bike, data, distância (km) e tempo em movimento (horas). A tela "Pedais recentes" lista distância, tempo (em h e m), tipo, bike, data e origem de cada pedal, tem um botão para atualizar pela fonte e um botão + para lançar um pedal novo; pedais lançados à mão podem ser excluídos depois de uma confirmação. | M |
| RF15 | O sistema deve exibir um painel com um cartão por bike (foto e nome), recolhido por padrão, que o atleta expande para ver as peças da bike ordenadas por desgaste. | S |
| RF30 | O sistema deve permitir que o administrador mantenha o catálogo de peças no formato da planilha de catálogo: famílias (Transmissão, Suspensão, Pneus, Freios, Rodas, Canotes, Selins), cada uma com planos de manutenção padrão (métrica, intervalo e ação: troca ou revisão) e a indicação se desgasta em rolo (RB14); e componentes com código (ex.: `TRX-018`), marca, modelo, modalidade, subcategoria, detalhes, faixa de preço de referência e planos próprios, incluindo lançamentos. O catálogo pode ser carregado da planilha, sem duplicar itens pelo código. *(Alterado em 12/11/2026.)* | M |
| RF35 | O sistema deve manter bikes-modelo de fábrica (código, marca, modelo, versão, categoria e peças originais por posição) e, quando o atleta criar uma bike a partir de um modelo, instalar as peças originais com os planos sugeridos na data informada. *(Incluído em 12/11/2026, a partir da aba Bikes da planilha.)* | S |
| RF36 | Quando o atleta registrar uma revisão feita numa oficina (fora do programado), o sistema deve permitir informar de uma vez vários itens (peças e planos da bike, ou itens fora do catálogo, como o movimento central) e, para cada um, o que foi feito (verificado/ajustado, item revisado ou trocado, ou peça inteira trocada) e a condição informada pelo mecânico (boa, atenção, trocar em breve). Itens revisados ou trocados zeram o contador (RB13, RB18, RF10); todos vão para o histórico (RF11) com a oficina. *(Incluído em 13/11/2026 a pedido de João.)* | S |
| RF32 | O sistema deve permitir que o atleta escolha, e troque depois, a fonte dos seus pedais: **manual** (RF14), **API do Strava com app próprio** (RF33) ou **conector** (RF34). Enquanto não escolher, a fonte é manual. **[PROPOSTO]** | M |
| RF33 | Quando o atleta escolher a API do Strava, o sistema deve exibir o passo a passo para cadastrar um app no Strava, receber o `Client ID` e o `Client Secret` dele e vincular a conta por OAuth 2.0, usando esse app. **[PROPOSTO]** | M |
| RF34 | Quando o atleta escolher o conector, o sistema deve receber a URL e a chave de API do conector dele, validar a conexão e ler bikes e atividades por ele, sem chamar o Strava nem guardar token do Strava. **[PROPOSTO]** | M |
| RF31 | Quando o componente ou a bike-modelo desejada não existir no catálogo, o sistema deve permitir que o atleta peça a inclusão por um menu de ajuda; o pedido chega ao administrador, que cadastra o modelo no catálogo ou responde com um motivo. O atleta não cadastra nada no catálogo. *(Alterado em 12/11/2026 por decisão de João.)* | S |

> **RF06 e RF07:** o uso de cada plano é calculado a partir dos pedais guardados, e não acumulado num contador da peça ([ADR-007](adr/ADR-007-desgaste-calculado-dos-pedais.md), OPEN-15). Ver o [modelo de domínio](dominio.md).

> **RF30** foi aprovado em 06/11/2026 para garantir o segundo perfil (Administrador) no MVP da Fase 1, como a disciplina exige (OPEN-06). Ele dá suporte ao RF02, ao RF03 e à RB10. O RF31 foi aprovado na mesma data (OPEN-08).

### Fase 2 — Mercado de peças (tentativa de entrega, 16/11/2026)

> Decisões de implementação marcadas **[PROPOSTO]** aguardam a aprovação do João (OPEN-30 a OPEN-34, [ADR-008](adr/ADR-008-mercado-de-pecas.md)).

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF16 | O sistema deve permitir que atletas e lojistas publiquem anúncios de peças (título, família do catálogo, condição nova ou usada, preço, descrição, até 3 fotos por URL e km de uso quando usada). **[PROPOSTO]** fotos por URL, sem upload (OPEN-31). | M |
| RF17 | O sistema deve exibir uma vitrine de anúncios ativos filtrável por família, condição, faixa de preço e tipo de vendedor (lojista ou atleta). | M |
| RF18 | O sistema deve permitir que o administrador cadastre lojistas (a partir de um usuário que já entrou pelo Google) e conceda ou revogue o selo de verificado. **[PROPOSTO]** lojista = usuário com perfil de loja, sem novo papel de acesso (OPEN-30). | M |
| RF19 | Enquanto um lojista possuir selo de verificado, o sistema deve exibir o selo em seus anúncios e em sua vitrine. | M |
| RF20 | O sistema deve permitir que o atleta cadastre, edite e remova um "sonho": peça desejada (família e palavras-chave opcionais) com preço máximo. | M |
| RF21 | Quando um anúncio compatível com um sonho for publicado com preço menor ou igual ao preço máximo, o sistema deve notificar o atleta dono do sonho. Compatível = mesma família e, se o sonho tiver palavras-chave, todas aparecem no título. **[PROPOSTO]** (OPEN-32). | M |
| RF22 | Quando um sonho for cadastrado, o sistema deve notificar os lojistas verificados que já anunciaram naquela família. **[PROPOSTO]** "vende a família" = tem anúncio ativo ou vendido nela (OPEN-33). | S |
| RF23 | Quando um alerta de "troca próxima" for emitido, o sistema deve sugerir anúncios ativos da família da peça. | C |
| RF24 | O sistema deve permitir que o administrador remova anúncios que violem as regras da plataforma, registrando o motivo. | M |

Notificações da Fase 2 são **dentro do app** (sino com lista e contador), coerente com a OPEN-14 (OPEN-34).
### Fase 3 — Oficina (implementação iniciada em 16/11/2026)

> Decisão de João em 16/11/2026: tentar entregar as Fases 2 e 3. A Fase 1 continua sendo a entrega garantida e tem prioridade. Os requisitos abaixo vêm de [segundo-estagio.md](segundo-estagio.md); as decisões de interpretação estão marcadas **[PROPOSTO]** e listadas em OPEN-40 a OPEN-44.

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF25 | O sistema deve permitir que mecânicos/oficinas cadastrem perfil (nome, descrição, endereço, telefone), serviços oferecidos (com o que cada nível de revisão inclui) e horários disponíveis. O administrador cadastra a oficina com o e-mail Google do responsável, e só esse responsável edita a oficina. **[PROPOSTO]** (OPEN-40, OPEN-41) | M |
| RF26 | O sistema deve permitir que o atleta agende uma revisão, para uma das suas bikes, em um horário livre de uma oficina ativa, escolhendo o serviço. Um horário só pode ter um agendamento ativo. | M |
| RF27 | Quando o atleta agendar uma revisão, o sistema deve compartilhar com a oficina o histórico daquela bike (dados da bike, peças instaladas e histórico de manutenção), e avisar o atleta disso antes de confirmar. **[PROPOSTO]** (OPEN-42) | M |
| RF28 | Quando a oficina concluir um serviço, o sistema deve registrar o serviço e as peças trocadas no histórico da bike, como uma visita à oficina (RF36), já com os itens do nível de revisão contratado. **[PROPOSTO]** (OPEN-44) | M |
| RF29 | Se o atleta cancelar um agendamento com menos de 24 h de antecedência, então o sistema deve notificar a oficina imediatamente (aviso dentro do app, OPEN-43). Cancelamentos com mais antecedência também liberam o horário e avisam a oficina, sem destaque de urgência. **[PROPOSTO]** | S |

---

## 2. Requisitos Não Funcionais

Os RNFs também seguem o padrão EARS.

| ID | Categoria | Requisito (EARS) |
|---|---|---|
| RNF01 | Segurança | Quando o atleta vincular o Strava (RF33) ou o conector (RF34), o sistema deve armazenar criptografados, apenas no backend, os tokens do Strava, o `Client Secret` do app dele e a chave de API do conector, sem expô-los ao frontend nem aos logs. |
| RNF02 | Segurança | O sistema não deve armazenar senhas: todos os usuários se autenticam pelo Google (OpenID Connect), conforme o [ADR-005](adr/ADR-005-login-unico-google.md) e o [ADR-006](adr/ADR-006-fontes-de-pedais.md). *(Alterado em 12/11/2026; antes previa hash de senha com bcrypt ou argon2.)* |
| RNF03 | Privacidade (LGPD) | Se um terceiro (oficina) tentar ver o histórico de uma bike sem autorização do atleta, então o sistema deve negar o acesso. A autorização é o agendamento (RF27) e a permissão é conferida a cada requisição (RB09). *(Fase 3, 16/11/2026.)* |
| RNF04 | Desempenho | O sistema deve carregar as páginas principais em até 2 s em conexão 4G. |
| RNF05 | Integração | Enquanto estiver integrado ao Strava, o sistema deve respeitar os limites de requisição da API, usando webhooks quando disponíveis e polling como alternativa. |
| RNF06 | Disponibilidade | Se o Strava estiver indisponível, então o sistema deve manter as demais funções em uso. |
| RNF07 | Usabilidade | O sistema deve ter interface responsiva e utilizável em celular. |
| RNF08 | Manutenibilidade | O sistema deve seguir as convenções do `CLAUDE.md` e ter testes automatizados para as regras de cálculo de desgaste, executáveis sem banco e sem UI. |
| RNF09 | Rastreabilidade | O sistema deve manter cada requisito rastreável até caso de uso, código e teste. |

---

## 3. Regras de Negócio

| ID | Regra |
|---|---|
| RB01 | Uma peça pertence a no máximo uma bike por vez. |
| RB02 | A km e as horas de uma atividade só são somadas às peças que estavam instaladas na data da atividade. |
| RB03 | Somente atividades de ciclismo contam para o desgaste: `sport_type` `Ride`, `MountainBikeRide`, `GravelRide`, `EBikeRide`, `EMountainBikeRide` e `VirtualRide` (o `VirtualRide` segue a RB14). |
| RB04 | Limiares de alerta: a partir do mínimo da faixa de durabilidade do plano (ou de 80% do intervalo, se não houver mínimo) = troca/revisão próxima (barra amarela); 100% do intervalo = troca/revisão necessária. O intervalo é a média da faixa (OPEN-17). |
| RB05 | Uma peça trocada não pode ser excluída, apenas arquivada no histórico. |
| RB06 | Apenas o administrador concede ou revoga o selo de lojista verificado (RF18). |
| RB07 | Anúncio de peça usada pode informar a km de uso, preenchida **à mão** pelo vendedor. O GearLog não publica km vinda do Strava enquanto a OPEN-02 estiver aberta. **[PROPOSTO]** |
| RB19 | Só o autor edita, marca como vendido ou encerra o próprio anúncio; o administrador pode removê-lo (RF24). **[PROPOSTO]** |
| RB20 | O GearLog não processa pagamento nem intermedeia a negociação; a vitrine mostra o contato do vendedor (e-mail da conta Google) só a usuários logados. **[PROPOSTO]** (OPEN-35) |
| RB08 | Cada atleta usa o próprio app do Strava (RF33) ou o próprio conector (RF34), então o GearLog não depende de um app único do Strava nem de homologação comercial. |
| RB09 | Uma oficina só acessa o histórico de bikes com agendamento ativo ou concluído com ela. Agendamento cancelado encerra o acesso. *(Fase 3, 16/11/2026.)* |
| RB21 | Só o responsável pela oficina (o e-mail Google cadastrado pelo administrador) edita o perfil, os serviços e os horários dela e conclui os atendimentos dela. A permissão é conferida a cada requisição, como na RB17. **[PROPOSTO]** (OPEN-40) |
| RB22 | Um horário de oficina tem no máximo um agendamento ativo (agendado ou concluído); só horários futuros podem ser agendados. |
| RB10 | Cada categoria de peça define sua métrica de desgaste: km, horas ou ambas. Peças de suspensão (garfo, amortecedor) e canote retrátil são medidas por horas de uso. |
| RB11 | Quando a peça tiver vida útil em km e em horas, vale o critério que for atingido primeiro (maior percentual). |
| RB12 | Horas de uso = tempo em movimento da atividade (`moving_time`), não o tempo total decorrido. |
| RB13 | Peças medidas por horas podem ter **revisão** em vez de troca: registrar a revisão zera o contador de horas da peça sem encerrá-la. |
| RB14 | Uma atividade `VirtualRide` (rolo) só soma km e horas às peças cuja categoria está marcada no catálogo como "desgasta em rolo" (ex.: transmissão sim; pneus, freios e suspensão não). |
| RB15 | O atleta só cadastra peças com categoria e componente existentes no catálogo. Apenas o administrador inclui, edita ou desativa categorias e componentes. |
| RB16 | Uma peça tem planos de manutenção, herdados do componente (ou, se ele não tiver, da família) e editáveis pelo atleta. Cada plano tem métrica, intervalo e ação (troca ou revisão). O desgaste, os alertas (RB04) e a revisão (RB13) valem por plano; a troca da peça inteira (RF10) encerra a peça e todos os seus planos. Peça sem desgaste regular (ex.: selim, canote rígido) pode não ter plano. *(Alterado em 12/11/2026.)* |
| RB18 | Quando a peça tem mais de um plano, a troca de um item consumível dela (ex.: corrente ou cassete do grupo de transmissão) zera só o plano desse item e fica no histórico como troca, sem encerrar a peça. Para trocar dois itens (ex.: corrente e cassete), o atleta lança a troca de cada um (OPEN-18). |
| RB17 | Só acessa a área administrativa (`/admin`) quem entra com uma conta Google de e-mail verificado que está na lista de administradores autorizados (`ADMIN_EMAILS`). A permissão é conferida a cada acesso (ADR-002). |

---

## 4. Vida útil padrão sugerida (referência para RF03)

> Desde 12/11/2026 os intervalos por componente vêm da planilha de catálogo (abas Transmissão, Suspensão, Pneus, Freios, Rodas e Canotes, com fontes na aba "Leia-me e fontes"), exportada para `src/lib/catalog/seed.json`. Quando a planilha dá uma faixa (mín–máx), o intervalo do plano é a média da faixa e a barra fica amarela a partir do mínimo (OPEN-17). Regras de desgaste por condição de uso ficam para a issue #38. A tabela abaixo continua como referência dos planos padrão por família.

Valores de partida, editáveis pelo atleta. Os valores de suspensão seguem a ordem de grandeza dos manuais dos fabricantes, que variam por modelo. O atleta deve conferir o manual da peça.

| Categoria | Métrica | Vida útil / intervalo padrão | Ação ao vencer |
|---|---|---|---|
| Corrente | km | 3.000 km | Troca |
| Cassete | km | 9.000 km | Troca |
| Coroas | km | 15.000 km | Troca |
| Pneu de estrada | km | 4.000 km | Troca |
| Pneu de MTB | km | 2.500 km | Troca |
| Pastilha de freio | km | 1.500 km | Troca |
| Cabo e conduíte | km | 5.000 km | Troca |
| Garfo — revisão de lowers (óleo e retentores) | h | 50 h | Revisão |
| Garfo — revisão completa (damper) | h | 125 h | Revisão |
| Amortecedor — revisão da câmara de ar | h | 50 h | Revisão |
| Amortecedor — revisão completa | h | 125 h | Revisão |
| Canote retrátil — revisão | h | 200 h | Revisão |
| Rolamentos de pivô | h | 100 h | Revisão/troca |
| Fluido de freio (sangria) | h | 100 h | Revisão |

> Um mesmo componente físico (ex.: garfo) pode ter mais de um plano de manutenção (revisão de lowers e revisão completa), conforme a RB16, aprovada em 06/11/2026 (OPEN-07).

---

## 5. Situação da implementação e rastreabilidade (RNF09)

Atualizado em 12/11/2026. Código em `src/`, testes em `tests/unit/`.

| Requisito | Situação | Código | Teste |
|---|---|---|---|
| RF01 | Feito | `src/app/bikes/`, `src/app/actions/bikes.ts` | — (fluxo manual) |
| RF02, RF03 | Feito | `src/app/bikes/[id]/peca/`, `createPart`, `src/lib/catalog/rules.ts` | `catalog.test.ts`, `rides-map.test.ts` |
| RF04 | Feito | `src/app/auth/google/`, `src/lib/google/` | `google-admin-login.test.ts`, `activity-sources.test.ts` |
| RF05 | Feito | `linkSourceBike`, `listSourceBikes` (`src/lib/rides/sync.ts`) | `rides-map.test.ts` |
| RF06 | Feito (sincronização manual pelo botão) | `src/lib/rides/sync.ts`, `src/lib/wear.ts` | `wear.test.ts`, `rides-map.test.ts` |
| RF07, RF08, RF09 | Feito (alerta dentro do app, OPEN-14) | `src/lib/wear.ts`, `src/components/ui.tsx` | `wear.test.ts` |
| RF10, RF11, RF12 | Feito | `replacePart`, `servicePlan`, `addManualMaintenance`, página da bike | `wear.test.ts` (revisão por plano) |
| RF13 | Feito | `syncRides` grava `lastSyncError` sem apagar dados | — |
| RF14 | Feito | `src/app/pedais/`, `src/app/actions/rides.ts`, `src/lib/format.ts` | `rides-map.test.ts` (datas), `bike-photo.test.ts` (tempo em h e m) |
| RF15 | Feito | `src/app/page.tsx`, `src/lib/tracker.ts`, `src/components/bike-avatar.tsx` | `wear.test.ts` (ordenação) |
| RF01 (foto) | Feito | `setBikePhoto`, `src/app/bikes/[id]/foto/route.ts`, `src/lib/bike-photo.ts` | `bike-photo.test.ts` |
| RF30 | Feito | `src/app/admin/`, `src/app/actions/catalog.ts`, `src/lib/catalog/seed.json`, `src/lib/catalog/load.ts`, `src/instrumentation.ts` (carga automática na subida do servidor) | `catalog.test.ts` |
| RF35 | Feito | `createBike`, `src/app/bikes/page.tsx` | `catalog.test.ts` |
| RF36 | Feito | `recordShopVisit`, `src/lib/visit.ts`, página da bike | `visit.test.ts` |
| RF31 | Feito | `src/app/ajuda/`, `src/app/actions/help.ts`, `src/components/admin-requests.tsx`, `src/lib/help.ts` | `model-request.test.ts` |
| RF16, RF17 | Feito (Fase 2) | `src/app/mercado/`, `src/app/actions/market.ts`, `src/lib/market.ts` | `market.test.ts` |
| RF18, RF19, RF24 | Feito (Fase 2) | `src/app/actions/merchants.ts`, `src/components/admin-market.tsx`, `src/components/seller-badge.tsx` | `merchants.test.ts` |
| RF20, RF21, RF22, RF23 | Feito (Fase 2); funções com banco sem teste automatizado | `src/app/sonhos/`, `src/app/notificacoes/`, `src/lib/dreams.ts`, `createListing` | `dreams.test.ts` (`matchesDream`) |
| RF32, RF33, RF34 | Feito | `src/app/fonte/`, `src/lib/strava/`, `src/lib/connector/` | `strava-oauth.test.ts`, `activity-sources.test.ts` |
| RF25–RF29, RNF03, RB09 | Feito (16/11/2026, aguarda aprovação dos [PROPOSTO]) | `src/app/oficina/`, `src/app/oficinas/`, `src/app/agendamentos/`, `src/app/actions/workshops.ts`, `src/lib/workshop.ts` | `workshop.test.ts` |
| RB02, RB03, RB04, RB11–RB14, RB16 | Feito | `src/lib/wear.ts` | `wear.test.ts` |
| RB18 | Feito | `servicePlan`, `canResetPlan` | `catalog.test.ts` |
| RB17 | Feito | `src/lib/session.ts` (`getCurrentAdmin`) | `google-admin-login.test.ts` |
| RNF01 | Feito | `src/lib/crypto.ts` | `crypto.test.ts` |
| RNF05 | Parcial: no máximo 10 páginas por sincronização manual; webhook pendente | `src/lib/rides/sync.ts` | — |
