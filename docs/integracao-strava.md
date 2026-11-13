# Integração Strava — Contrato do Conector

Requisitos atendidos: RF04, RF05, RF06, RF13, RF14, RNF01, RNF05, RNF06, RB02, RB03, RB08, RB10–RB12.

## 0. Princípio: compatível com o Strava

O conector do GearLog expõe **um subconjunto da API v3 do Strava**, com os mesmos caminhos, parâmetros, nomes de campos, unidades, paginação e formato de erro. Quem consome o conector ou a API do Strava **recebe o mesmo resultado**. O contrato oficial é o Swagger do Strava (`https://developers.strava.com/swagger/swagger.json`), recortado nos endpoints e campos listados abaixo.

```
                 STRAVA_API_BASE_URL
GearLog (core) ─────────────────────────┬──► https://www.strava.com/api/v3   (Strava real)
  StravaClient                          ├──► https://<conector>/api/v3        (conector GearLog)
                                        └──► http://localhost:4010/api/v3     (mock gerado do Swagger, para testes)
```

O que isso garante:

- **Intercambiável:** trocar de fonte é só mudar `STRAVA_API_BASE_URL`. O código do GearLog não muda.
- **Contrato verificável:** as respostas do conector são validadas contra o mesmo Swagger que descreve o Strava (teste de contrato).
- **Testes e demo sem depender do Strava:** um mock server gerado do Swagger (ex.: Prism) ou o próprio conector em modo cache.
- **Clientes prontos:** qualquer biblioteca cliente do Strava (ex.: `strava-v3` para Node) funciona apontando para o conector.

Regra de ouro: **o conector não converte nada.** Distância em metros, tempo em segundos, datas ISO-8601 exatamente como o Strava devolve. A conversão para km e horas acontece **dentro do GearLog**, na camada de domínio (seção 6).

### Modos de operação do conector

| Modo | Comportamento | Uso |
|---|---|---|
| **Proxy** | Repassa a chamada ao Strava com o token do atleta e devolve a resposta sem alterar | Produção |
| **Cache** | Responde a partir das atividades e bikes já importadas, no mesmo formato do Strava | Strava fora do ar (RNF06), rate limit, demo offline |

Os dois modos devolvem o mesmo JSON. O cliente não precisa saber qual está ativo.

---

## 1. O que o GearLog precisa (e por quê)

| Dado | Para quê | Requisito |
|---|---|---|
| Bikes do atleta (gear) | Associar cada bike do Strava a uma bike do GearLog | RF05 |
| Atividades de ciclismo, com **bike, data, distância e tempo em movimento** | Somar **km e horas** só às peças instaladas na data da atividade | RF06, RB02 |
| `sport_type` da atividade | Contar só atividades de ciclismo | RB03 |
| Eventos de criação, edição e exclusão de atividade | Manter km e horas corretas quando o atleta troca a bike da atividade ou a apaga | RF06 |
| Revogação de acesso | Parar a sincronização e apagar os tokens | RNF01 |

### Duas métricas de desgaste: km e horas

| Métrica | Campo Strava | Peças típicas |
|---|---|---|
| **Quilômetros** | `distance` (metros) | corrente, cassete, coroas, pneus, pastilhas, cabos |
| **Horas de uso** | `moving_time` (segundos) | garfo e amortecedor (revisão de lowers/câmara de ar e revisão completa), canote retrátil, rolamentos de pivô |

Pelos manuais dos fabricantes, a suspensão é revisada **por horas de uso**: uma hora de trilha técnica desgasta muito mais a suspensão do que uma hora de asfalto, mesmo cobrindo menos km. Por isso `moving_time` é tão obrigatório quanto `distance`.

> **Atenção ao modelo:**
> - A `distance` que o Strava devolve para cada bike é a **distância total da bike**.
> - O Strava **não guarda horas por bike**. Não existe total de horas no objeto gear.
>
> Por isso o GearLog precisa das **atividades individuais**, cada uma com distância **e** tempo, e soma as duas métricas por peça a partir da data de instalação.

**Por que `moving_time` e não `elapsed_time`:** `elapsed_time` inclui paradas (café, semáforo, pneu furado), quando a suspensão não está trabalhando.

**Não usar** (minimização de dados, LGPD): streams/GPS, polyline, frequência cardíaca, potência, cadência, segmentos, fotos, kudos e comentários. O conector **não implementa** esses endpoints. No modo proxy, os campos que o Strava devolver a mais são repassados como vieram, mas o GearLog ignora tudo que não está nas tabelas abaixo.

---

## 2. Autenticação (OAuth 2.0)

O conector aceita a autenticação **no mesmo formato do Strava**: `Authorization: Bearer <access_token>`.

| Item | Valor |
|---|---|
| Autorização | `GET https://www.strava.com/oauth/authorize` |
| Troca e refresh de token | `POST https://www.strava.com/oauth/token` |
| Escopos | `read`, `profile:read_all` (lista de bikes) e `activity:read_all` (inclui atividades privadas) |
| Validade do access token | ~6 h (`expires_at`). Renovar com `refresh_token` antes de expirar. |
| Armazenamento | Tokens criptografados, só no backend (RNF01) |

O OAuth é sempre feito com o Strava real. O conector valida o Bearer recebido e, no modo proxy, repassa o token ao Strava.

O app novo no Strava começa em **Single Player Mode**, com capacidade para 1 atleta: só a conta do desenvolvedor. Isso já cobre a RB08.

---

## 3. Endpoints do subconjunto

Todos sob `{STRAVA_API_BASE_URL}` = `.../api/v3`. Caminhos, parâmetros e respostas são **idênticos** aos do Strava.

| Método e caminho | Schema Strava da resposta | Uso no GearLog |
|---|---|---|
| `GET /athlete` | `DetailedAthlete` | Atleta e lista `bikes[]` (RF05) |
| `GET /gear/{id}` | `DetailedGear` | Detalhe da bike |
| `GET /athlete/activities?before=&after=&page=&per_page=` | `SummaryActivity[]` | Backfill e polling |
| `GET /activities/{id}` | `DetailedActivity` | Rebuscar a atividade após um webhook |
| `GET/POST /push_subscriptions` | `PushSubscription` | Inscrição de webhook (seção 4) |

### 3.1 Campos usados — `DetailedAthlete`
`id`, `firstname`, `lastname`, `bikes[]` (`SummaryGear`: `id`, `name`, `primary`, `distance`, `retired`).

### 3.2 Campos usados — `DetailedGear`
`id` (ex.: `"b1234567"`), `name`, `brand_name`, `model_name`, `frame_type` (1=MTB, 2=cross, 3=road, 4=TT, 5=gravel), `distance` (m), `primary`, `retired`.

### 3.3 Campos usados — `SummaryActivity` / `DetailedActivity`

| Campo | Tipo/unidade | Uso |
|---|---|---|
| `id` | int64 | Chave de idempotência |
| `sport_type` | enum | Filtro RB03 |
| `gear_id` | string ou `null` | Qual bike |
| `start_date` | ISO-8601 UTC | Quais peças estavam instaladas (RB02) |
| `distance` | float, **metros** | Desgaste em km — obrigatório |
| `moving_time` | int, **segundos** | Desgaste em horas — obrigatório |
| `elapsed_time` | int, segundos | Não usado para desgaste (RB12) |
| `total_elevation_gain` | float, metros | Opcional, análise futura |
| `trainer` | bool | Atividade em rolo |
| `manual` | bool | Atividade digitada à mão |

`sport_type` aceitos pelo GearLog: `Ride`, `MountainBikeRide`, `GravelRide`, `EBikeRide`, `EMountainBikeRide`, `VirtualRide`. O conector **não filtra** (o Strava também não). O filtro é regra de negócio e fica no GearLog. Se `VirtualRide` (rolo) desgasta todas as peças ou só a transmissão é uma decisão em aberto: precisa de um ADR.

### 3.4 Paginação, erros e limites (iguais ao Strava)

- **Paginação:** `page` começa em 1, `per_page` vai até 200, e uma lista vazia indica o fim.
- **Erros:** mesmo corpo do Strava, `{"message": "...", "errors": [{"resource", "field", "code"}]}`, com os mesmos status (`401`, `404`, `429`).
- **Headers de rate limit:** o conector devolve `X-RateLimit-Limit`, `X-RateLimit-Usage`, `X-ReadRateLimit-Limit` e `X-ReadRateLimit-Usage`. No modo proxy, repassa os do Strava. No modo cache, informa os próprios.

---

## 4. Webhooks (mesmo formato do Strava)

O conector **recebe** os webhooks do Strava e **emite** webhooks no mesmo formato. Quem assina o conector recebe eventos idênticos aos do Strava.

- **Inscrição:** `POST /push_subscriptions` com `client_id`, `client_secret`, `callback_url` e `verify_token`.
- **Validação:** `GET {callback_url}?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...`. O assinante responde `{"hub.challenge": "..."}` em até 2 s.
- **Evento** (`POST` no callback):

```json
{
  "object_type": "activity",
  "object_id": 1234567890,
  "aspect_type": "update",
  "owner_id": 134815,
  "subscription_id": 120475,
  "event_time": 1516126040,
  "updates": { "title": "Pedal de domingo" }
}
```

- **Regras do assinante (GearLog):**
  - Responder `200` **em até 2 s** e processar de forma assíncrona (fila).
  - Em `create` e `update`, rebuscar com `GET /activities/{id}`. O campo `updates` não traz todos os campos, e a troca de bike não vem de forma confiável nele.
  - Se chegar `object_type = "athlete"` com `updates.authorized = "false"`, apagar os tokens.
- **Ambiente local:** o Strava precisa de uma URL pública. Em desenvolvimento, usar um túnel (ngrok ou cloudflared) ou depender só do polling.

---

## 5. Lado do GearLog: `StravaClient` e tradução para o domínio

O GearLog tem **um único cliente** para o formato Strava, configurado por `STRAVA_API_BASE_URL`. A tradução para o domínio acontece aqui, não no conector:

| Campo Strava | Campo no domínio GearLog | Conversão |
|---|---|---|
| `id` | `Atividade.stravaId` | — |
| `gear_id` | `Atividade.bike` (via associação) | Busca da bike associada |
| `start_date` | `Atividade.data` | — |
| `distance` | `Atividade.km` | `distance / 1000` |
| `moving_time` | `Atividade.horas` | `moving_time / 3600`, 2 casas decimais |
| `sport_type` | `Atividade.tipo` | Descarta o que não é ciclismo (RB03) |

---

## 6. Casos de borda que o GearLog trata

| Caso | Tratamento |
|---|---|
| Mesma atividade recebida duas vezes | Idempotência por `id` |
| `update` trocou a bike da atividade | Desfazer km **e horas** na bike antiga e aplicar na nova |
| `update` corrigiu distância ou tempo | Recalcular km e horas das peças afetadas |
| `delete` | Subtrair km **e horas** das peças afetadas |
| `gear_id = null` | Atividade fica "pendente de bike" até o atleta associar |
| Bike do Strava não associada no GearLog | Ignorar até a associação; ao associar, reprocessar o histórico |
| Peça instalada com data retroativa | Recalcular km e horas da peça a partir das atividades salvas |
| `moving_time = 0` (ex.: atividade manual sem tempo) | Somar só a km; as horas ficam zeradas e o atleta é avisado de que as peças medidas por hora podem estar subestimadas |

Para isso, o GearLog **guarda as atividades importadas**, não só os totais. Os acumulados de cada peça (km e horas) são sempre derivados dessas atividades.

---

## 7. Testes de contrato

- O repositório guarda o Swagger do Strava recortado: `docs/api/strava-subset.yaml`, só com os endpoints e schemas da seção 3.
- **Teste de contrato:** as respostas do conector, nos modos proxy e cache, são validadas contra `strava-subset.yaml`.
- **Mock:** `prism mock docs/api/strava-subset.yaml` sobe uma API compatível em `localhost:4010`, usada nos testes do GearLog e na demo.
- **Teste de equivalência:** para uma mesma atividade, a resposta do conector e a do Strava real devem ser iguais nos campos da seção 3.3.

---

## 8. Limites e falhas

- **Rate limit padrão do Strava:** 100 leituras a cada 15 min e 1.000 por dia (total de 200 a cada 15 min e 2.000 por dia). Ler `X-ReadRateLimit-*` e fazer backoff no `429`. O modo cache do conector economiza chamadas.
- **Backfill:** usar `per_page=200`.
- **Falha do Strava:** o conector passa ao modo cache, o GearLog mantém os dados, registra o erro e permite nova tentativa manual (RF13, RNF06).
- **Termos de uso da API:** os dados do Strava são exibidos só para o próprio atleta. Antes de mostrar a km/horas de uso de uma peça a outros usuários no marketplace (RB07), confirmar que isso é permitido.

## 9. Configuração

`STRAVA_API_BASE_URL`, `STRAVA_OAUTH_BASE_URL` (padrão `https://www.strava.com/oauth`; trocado só em testes), `STRAVA_CALLBACK_URL` (padrão `APP_URL` + `/auth/strava/callback`) e `TOKEN_ENCRYPTION_KEY` (RNF01) ficam no Infisical (ambiente `dev`) e são injetados no processo por `infisical run` ([ADR-003](adr/ADR-003-segredos-infisical.md)). No repositório entra só o `.env.example`, com os nomes das variáveis e sem valores.

> **[PROPOSTO] (12/11/2026, ADR-006):** não há app do Strava global. Cada atleta cadastra o próprio app (`Client ID` e `Client Secret` guardados criptografados no banco, RF33) ou usa o próprio conector (RF34). Por isso `STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET` não existem mais como variáveis de ambiente.
