# ADR-011 — Strava direto, sem o conector

- **Status:** Aceito (19/11/2026)
- **Data:** 19/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-50 · atualiza [ADR-006](ADR-006-fontes-de-pedais.md)
- **Requisitos relacionados:** RF05, RF06, RF13, RF32, RF34 (removido), RNF01, RNF05, RNF06, RB08

## Contexto

O ADR-006 manteve o `strava-connector` como ponte até o app central do GearLog existir. O app central já tem credenciais (`STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET`, vindas do Infisical) e o login por OAuth já está no site e no app Expo. Manter o conector só duplicava caminho de código e obrigava o atleta a ter um conector próprio.

## Decisão

- O GearLog lê o Strava **direto**: OAuth com o app central, `GET /athlete` (bikes), `GET /athlete/activities` (sincronização manual, incremental, no máximo 10 páginas) e `GET /activities/{id}` (um pedal, por evento).
- **Webhook** em `/api/strava/webhook`: o `GET` responde ao desafio de validação (`hub.verify_token` derivado da `TOKEN_ENCRYPTION_KEY`, sem segredo novo); o `POST` responde 200 na hora e processa depois (pedal criado/editado entra, apagado sai, atleta que revoga o GearLog tem os tokens apagados). A inscrição é criada uma vez pelo administrador, no botão "Ativar avisos do Strava" em `/admin`.
- O código do conector (`src/lib/connector`, `/fonte/conector`, tabela `ConnectorConnection`, valor `CONNECTOR`, o pedido de releitura `POST /v1/gearlog/sync` do PR #125) foi **removido**. Migração: pedais vindos do conector viram `STRAVA` (mesmos ids de atividade); atletas que usavam o conector voltam para **manual** até conectarem o Strava; a URL e a chave do conector são apagadas.
- O `strava-connector` em si **não muda** e continua de pé para o portfólio do autor.
- O GearLog passa a guardar os tokens do Strava (criptografados, AES-256-GCM, RNF01). A política de privacidade foi atualizada.
- **Capacidade:** com o app no modo de um atleta, o Strava aceita **10 atletas**. Além disso a autorização falha (`token_exchange_failed`) e o atleta usa o modo manual (RB08). Para crescer é preciso pedir o aumento ao Strava ([strava-solicitacao.md](../strava-solicitacao.md)).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter o conector como segunda fonte | Dois caminhos para a mesma coisa; o conector tinha limite de uma releitura por hora. |
| Webhook só pelo conector | Depende de um serviço fora do GearLog. |

## Consequências

- Atletas que usavam o conector precisam conectar o Strava de novo.
- Exclusões no Strava chegam pelo webhook (fecha T-17 e a lacuna A4 da revisão de arquitetura).
- Sem o webhook ativo, o botão "Sincronizar" continua funcionando, mas não apaga pedais removidos no Strava.
