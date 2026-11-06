# Integração Strava — Contrato do Conector

O conector do Strava é um componente separado do GearLog. Ele cuida do OAuth, das chamadas à API e dos webhooks. Para o GearLog, entrega só dados já normalizados. O GearLog nunca chama o Strava diretamente.

Requisitos atendidos: RF04, RF05, RF06, RF13, RNF01, RNF05, RNF06, RB02, RB03, RB08.

---

## 1. O que o GearLog precisa (e por quê)

| Dado | Para quê | Requisito |
|---|---|---|
| Bikes do atleta (gear) | Associar cada bike do Strava a uma bike do GearLog | RF05 |
| Atividades de ciclismo, com **bike, data, distância e tempo em movimento** | Somar km e horas **só às peças instaladas na data da atividade** | RF06, RB02 |
| Tipo de esporte da atividade | Contar só atividades de ciclismo | RB03 |
| Eventos de criação, edição e exclusão de atividade | Manter a km correta quando o atleta troca a bike da atividade ou a apaga | RF06 |
| Revogação de acesso | Parar a sincronização e apagar os tokens | RNF01 |

> **Atenção ao modelo:** a `distance` que o Strava devolve para cada bike é a **km total da bike**. Isso não basta, porque cada peça tem sua própria km, contada a partir da data de instalação. Por isso o conector precisa entregar as **atividades individuais**, não só o total da bike.

**Não extrair** (minimização de dados, LGPD): GPS e rotas (streams/polyline), frequência cardíaca, potência, cadência, segmentos, fotos, kudos e comentários.

---

## 2. Autenticação (OAuth 2.0)

| Item | Valor |
|---|---|
| Autorização | `GET https://www.strava.com/oauth/authorize` |
| Troca e refresh de token | `POST https://www.strava.com/oauth/token` |
| Escopos | `read`, `profile:read_all` (lista de bikes) e `activity:read_all` (inclui atividades privadas) |
| Validade do access token | ~6 h (`expires_at`). Renovar com `refresh_token` antes de expirar. |
| Armazenamento | `access_token` e `refresh_token` criptografados, só no backend (RNF01) |

O app novo no Strava começa em **Single Player Mode**, com capacidade para 1 atleta: só a conta do desenvolvedor. Isso já cobre a RB08.

---

## 3. Endpoints usados

### 3.1 `GET /api/v3/athlete` — atleta e lista de bikes
Campos usados: `id`, `firstname`, `lastname` e `bikes[]`, onde cada bike traz `id` (ex.: `"b1234567"`), `name`, `primary`, `distance` (m) e `retired`.

### 3.2 `GET /api/v3/gear/{id}` — detalhe da bike
Campos usados: `id`, `name`, `brand_name`, `model_name`, `frame_type`, `distance` (m), `primary` e `retired`.

### 3.3 `GET /api/v3/athlete/activities?after=&before=&page=&per_page=200` — importação em lote
Usado na **carga inicial** (backfill), para buscar atividades desde a data de instalação da peça mais antiga, e como **polling** de reserva quando não há webhook.

### 3.4 `GET /api/v3/activities/{id}` — atividade individual
Usado quando chega um evento de webhook, para buscar o estado atual da atividade.

Campos de atividade usados (vale para 3.3 e 3.4):

| Campo Strava | Uso |
|---|---|
| `id` | chave de idempotência |
| `sport_type` | filtro RB03 |
| `gear_id` | qual bike (pode vir `null`) |
| `start_date` (UTC) | decidir quais peças estavam instaladas (RB02) |
| `distance` (m) | km de desgaste |
| `moving_time` (s) | horas de uso (suspensão) |
| `total_elevation_gain` (m) | opcional, para uma análise futura |
| `trainer`, `manual` | marcar atividade em rolo ou digitada à mão |

`sport_type` aceitos: `Ride`, `MountainBikeRide`, `GravelRide`, `EBikeRide`, `EMountainBikeRide`, `VirtualRide`. Se `VirtualRide` (rolo) desgasta todas as peças ou só a transmissão é uma decisão em aberto: precisa de um ADR.

---

## 4. Webhooks (atualização em tempo real)

- **Inscrição:** `POST /api/v3/push_subscriptions` com `client_id`, `client_secret`, `callback_url` e `verify_token`.
- **Validação:** o Strava faz um `GET` no callback com `hub.challenge`. O conector deve responder `{"hub.challenge": "..."}` em até 2 s.
- **Evento:** o Strava faz um `POST` com `object_type` (`activity` ou `athlete`), `aspect_type` (`create`, `update` ou `delete`), `object_id`, `owner_id`, `updates` e `event_time`.
- **Regras do conector:**
  - Responder `200` **em até 2 s** e processar o evento de forma assíncrona (fila).
  - Em `create` e `update`, rebuscar a atividade com `GET /activities/{id}`. O campo `updates` não traz todos os campos, e a troca de bike não vem de forma confiável nele.
  - Se chegar `athlete` com `updates.authorized = "false"`, apagar os tokens e emitir `AthleteDeauthorized`.
- **Ambiente local:** o callback precisa de uma URL pública. Em desenvolvimento, usar um túnel (ex.: ngrok ou cloudflared) ou depender só do polling.

---

## 5. Contrato de saída (conector → GearLog)

Unidades já convertidas: km, segundos e datas em ISO-8601 UTC.

```ts
type ConnectorBike = {
  stravaGearId: string;      // "b1234567"
  name: string;
  brand?: string;
  model?: string;
  frameType?: number;        // código do Strava (1=MTB, 2=cross, 3=road, 4=TT, 5=gravel)
  totalDistanceKm: number;   // apenas informativo
  primary: boolean;
  retired: boolean;
};

type ConnectorActivity = {
  stravaActivityId: string;
  stravaGearId: string | null;
  sportType: "Ride" | "MountainBikeRide" | "GravelRide" | "EBikeRide" | "EMountainBikeRide" | "VirtualRide";
  startDate: string;         // UTC
  distanceKm: number;
  movingTimeSec: number;
  elevationGainM?: number;
  trainer: boolean;
  manual: boolean;
};

type ConnectorEvent =
  | { type: "ActivityUpserted"; activity: ConnectorActivity }
  | { type: "ActivityDeleted"; stravaActivityId: string }
  | { type: "AthleteDeauthorized"; stravaAthleteId: string };
```

### Interface mínima

| Operação | Descrição |
|---|---|
| `getAuthorizationUrl()` / `handleOAuthCallback(code)` | Vincular a conta (RF04) |
| `listBikes()` | Listar bikes para associação (RF05) |
| `listActivities(since: Date)` | Backfill e polling, já filtrado por ciclismo |
| `onEvent(handler)` | Entrega de `ConnectorEvent` vindos do webhook |
| `getStatus()` | Última sincronização, último erro, tokens válidos (RF13) |

O conector pode ser um módulo no backend ou um serviço separado com REST. O contrato acima vale nos dois casos. Registrar a escolha em um ADR.

---

## 6. Casos de borda que o GearLog trata (não o conector)

| Caso | Tratamento |
|---|---|
| Mesma atividade recebida duas vezes | Idempotência por `stravaActivityId` |
| `update` trocou a bike da atividade | Desfazer a km na bike antiga e aplicar na nova |
| `delete` | Subtrair a km das peças afetadas |
| `stravaGearId = null` | Atividade fica "pendente de bike" até o atleta associar |
| Bike do Strava não associada no GearLog | Ignorar até a associação; ao associar, reprocessar o histórico |
| Peça instalada com data retroativa | Recalcular a km da peça a partir das atividades salvas |

Para fazer isso, o GearLog **guarda as atividades importadas**, não só os totais.

---

## 7. Limites e falhas

- **Rate limit padrão:** 100 leituras a cada 15 min e 1.000 por dia (total de 200 a cada 15 min e 2.000 por dia). Ler os headers `X-ReadRateLimit-*` e fazer backoff no `429`.
- **Backfill:** usar `per_page=200` para gastar o mínimo de chamadas.
- **Falha do Strava:** manter os dados atuais, registrar o erro e permitir nova tentativa manual (RF13). O resto do GearLog continua funcionando (RNF06).
- **Termos de uso da API:** os dados do Strava são exibidos só para o próprio atleta. Antes de mostrar a "km de uso" de uma peça a outros usuários no marketplace (RB07), confirmar que isso é permitido.

## 8. Credenciais

`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN` e `STRAVA_CALLBACK_URL` vão no `.env`, que fica fora do Git. No repositório entra só o `.env.example`.
