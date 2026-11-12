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

> Os requisitos das Fases 2 e 3 (RF16–RF29, RNF03, RB06, RB07, RB09) estão em [segundo-estagio.md](segundo-estagio.md) e não fazem parte da entrega da disciplina.

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF01 | O sistema deve permitir que o atleta cadastre, edite e arquive bicicletas (nome, tipo, marca, modelo, ano). | M |
| RF02 | O sistema deve permitir que o atleta cadastre peças em uma bike, escolhendo a categoria e o componente (marca/modelo) do catálogo (RF30) e informando data de instalação, uso inicial (km e/ou horas) e os planos de manutenção da peça (RB16). | M |
| RF03 | Quando o atleta cadastrar uma peça sem informar vida útil, o sistema deve sugerir a vida útil padrão da categoria. | S |
| RF04 | Quando o usuário entrar com a conta Google (OpenID Connect), o sistema deve criar ou localizar o seu perfil: Administrador, se o e-mail verificado estiver em `ADMIN_EMAILS` (RB17), ou Atleta, nos demais casos. **[PROPOSTO]** *(Alterado em 12/11/2026; antes vinculava a conta Strava via OAuth 2.0. O vínculo com o Strava passa a ser a fonte B do RF32.)* | M |
| RF05 | Quando a fonte de pedais do atleta for o Strava (API própria, RF33) ou o conector (RF34), o sistema deve listar as bikes dessa fonte para associá-las às bikes do GearLog. | M |
| RF06 | Quando uma nova atividade de ciclismo chegar pela fonte do atleta (Strava ou conector), o sistema deve somar a distância (km) e o tempo em movimento (horas) da atividade à bike associada e às peças instaladas nela. | M |
| RF07 | O sistema deve calcular o desgaste de cada plano de manutenção da peça como percentual do intervalo consumido, em km e em horas, considerando o maior dos dois percentuais quando o plano tiver as duas métricas. | M |
| RF08 | Quando o desgaste de uma peça atingir 80%, o sistema deve emitir um alerta de "troca próxima" ou, para peças cuja ação é revisão (RB13), de "revisão próxima". | M |
| RF09 | Quando o desgaste de uma peça atingir 100%, o sistema deve emitir um alerta de "troca necessária" ou, para peças cuja ação é revisão (RB13), de "revisão necessária". | M |
| RF10 | Quando o atleta registrar a troca de uma peça, o sistema deve encerrar a peça antiga, registrá-la no histórico e iniciar a nova com km e horas zerados. | M |
| RF11 | O sistema deve exibir o histórico de manutenção de cada bike em ordem cronológica. | M |
| RF12 | O sistema deve permitir que o atleta registre manutenção manual (ex.: lubrificação, sangria de freio) sem troca de peça. | S |
| RF13 | Se a sincronização com a fonte (Strava ou conector) falhar, então o sistema deve manter os dados anteriores, registrar a falha e permitir nova tentativa manual. | M |
| RF14 | Onde a fonte de pedais do atleta for manual (RF32), o sistema deve permitir que o atleta lance cada pedal à mão, com bike, data, distância (km) e tempo em movimento (horas). | M |
| RF15 | O sistema deve exibir um painel com as peças de todas as bikes ordenadas por desgaste. | S |
| RF30 | O sistema deve permitir que o administrador mantenha o catálogo de peças: categorias (com os planos de manutenção padrão, cada um com métrica, intervalo e ação: troca ou revisão; e a indicação se a categoria se desgasta em rolo, RB14) e componentes (marca/modelo), incluindo o cadastro de lançamentos. | M |
| RF32 | O sistema deve permitir que o atleta escolha, e troque depois, a fonte dos seus pedais: **manual** (RF14), **API do Strava com app próprio** (RF33) ou **conector** (RF34). Enquanto não escolher, a fonte é manual. **[PROPOSTO]** | M |
| RF33 | Quando o atleta escolher a API do Strava, o sistema deve exibir o passo a passo para cadastrar um app no Strava, receber o `Client ID` e o `Client Secret` dele e vincular a conta por OAuth 2.0, usando esse app. **[PROPOSTO]** | M |
| RF34 | Quando o atleta escolher o conector, o sistema deve receber a URL e a chave de API do conector dele, validar a conexão e ler bikes e atividades por ele, sem chamar o Strava nem guardar token do Strava. **[PROPOSTO]** | M |
| RF31 | Quando o componente desejado não existir no catálogo, o sistema deve permitir que o atleta envie uma sugestão de novo componente, e que o administrador a aprove (incluindo o componente no catálogo) ou a rejeite com um motivo. | S |

> **RF30** foi aprovado em 06/11/2026 para garantir o segundo perfil (Administrador) no MVP da Fase 1, como a disciplina exige (OPEN-06). Ele dá suporte ao RF02, ao RF03 e à RB10. O RF31 foi aprovado na mesma data (OPEN-08).

---

## 2. Requisitos Não Funcionais

Os RNFs também seguem o padrão EARS.

| ID | Categoria | Requisito (EARS) |
|---|---|---|
| RNF01 | Segurança | Quando o atleta vincular o Strava (RF33) ou o conector (RF34), o sistema deve armazenar criptografados, apenas no backend, os tokens do Strava, o `Client Secret` do app dele e a chave de API do conector, sem expô-los ao frontend nem aos logs. |
| RNF02 | Segurança | O sistema não deve armazenar senhas: todos os usuários se autenticam pelo Google (OpenID Connect), conforme o [ADR-005](adr/ADR-005-login-unico-google.md) e o [ADR-006](adr/ADR-006-fontes-de-pedais.md). *(Alterado em 12/11/2026; antes previa hash de senha com bcrypt ou argon2.)* |
| RNF03 | Privacidade (LGPD) | *Movido para o [segundo estágio](segundo-estagio.md) (compartilhamento do histórico com oficinas).* |
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
| RB04 | Limiares de alerta: 80% da vida útil = troca/revisão próxima; 100% = troca/revisão necessária. |
| RB05 | Uma peça trocada não pode ser excluída, apenas arquivada no histórico. |
| RB06–RB07 | *Movidas para o [segundo estágio](segundo-estagio.md).* |
| RB08 | Cada atleta usa o próprio app do Strava (RF33) ou o próprio conector (RF34), então o GearLog não depende de um app único do Strava nem de homologação comercial. |
| RB09 | *Movida para o [segundo estágio](segundo-estagio.md).* |
| RB10 | Cada categoria de peça define sua métrica de desgaste: km, horas ou ambas. Peças de suspensão (garfo, amortecedor) e canote retrátil são medidas por horas de uso. |
| RB11 | Quando a peça tiver vida útil em km e em horas, vale o critério que for atingido primeiro (maior percentual). |
| RB12 | Horas de uso = tempo em movimento da atividade (`moving_time`), não o tempo total decorrido. |
| RB13 | Peças medidas por horas podem ter **revisão** em vez de troca: registrar a revisão zera o contador de horas da peça sem encerrá-la. |
| RB14 | Uma atividade `VirtualRide` (rolo) só soma km e horas às peças cuja categoria está marcada no catálogo como "desgasta em rolo" (ex.: transmissão sim; pneus, freios e suspensão não). |
| RB15 | O atleta só cadastra peças com categoria e componente existentes no catálogo. Apenas o administrador inclui, edita ou desativa categorias e componentes. |
| RB16 | Uma peça tem um ou mais planos de manutenção, herdados da categoria e editáveis pelo atleta. Cada plano tem métrica, intervalo e ação (troca ou revisão). O desgaste, os alertas (RB04) e a revisão (RB13) valem por plano; a troca (RF10) encerra a peça e todos os seus planos. |
| RB17 | Só acessa a área administrativa (`/admin`) quem entra com uma conta Google de e-mail verificado que está na lista de administradores autorizados (`ADMIN_EMAILS`). A permissão é conferida a cada acesso (ADR-002). |

---

## 4. Vida útil padrão sugerida (referência para RF03)

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
