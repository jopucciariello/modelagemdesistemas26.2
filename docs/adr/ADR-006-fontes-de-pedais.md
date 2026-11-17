# ADR-006 — Fonte dos pedais: manual ou Strava

- **Status:** Aceito (17/11/2026)
- **Data:** 12/11/2026; reescrito em 17/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-11, OPEN-12, OPEN-20, OPEN-22, OPEN-23
- **Requisitos relacionados:** RF05, RF06, RF13, RF14, RF32, RF34, RNF01, RNF06

## Contexto

Cada atleta precisa dizer de onde vêm os km e as horas dos pedais. O Strava só permite um app por conta, e o app do autor é do strava-connector. João decidiu em 16 e 17/11/2026: o GearLog terá um **app central** submetido ao Strava, mas a criação dele está adiada; até a aprovação, o conector é a ponte. A ideia é "pendurar no Strava", o caminho principal.

## Decisão

Há só **duas fontes** (RF32); a inicial é **manual**.

| Fonte | Como funciona | O que o GearLog guarda (criptografado, RNF01) |
|---|---|---|
| Manual (RF14) | O atleta lança cada pedal à mão | Nada além dos pedais |
| Strava (RF34) | Hoje, pelo **conector do atleta**: ele informa a URL e a chave de API, uma conexão por atleta. Quando o app central for aprovado, o GearLog lê direto do Strava (OAuth 2.0, `gearlog.jopucci.com`) | Hoje: chave de API do conector. Depois: tokens do Strava |

- **Removido:** o app Strava próprio de cada atleta (RF33), com `Client ID`/`Client Secret` por atleta e o tutorial. Isso resolve a OPEN-23.
- **Bike do pedal (OPEN-20):** vale a bike que vem do Strava; se o pedal veio sem bike, o atleta escolhe a bike à mão em cada atividade. **Não há bike padrão.**
- **Domínio de callback (OPEN-12):** `gearlog.jopucci.com`.
- Chave de API e tokens nunca voltam ao navegador. A URL do conector só pode ser `https` e não pode apontar para endereço privado ou local (SSRF); timeout de 10 s. Falha de uma fonte não derruba o app (RNF06, RF13).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| App do Strava por atleta | Exige que cada atleta crie um app; removido (OPEN-23). |
| Só o conector, para sempre | É ponte; o destino é o app central. |
| Conector global por variável de ambiente | Só serve para um atleta. |

## Consequências

- Remover o RF33 tira do banco `stravaClientId`, `stravaClientSecret` e rotas `/fonte/strava`, `/tutorial-strava`, `/auth/strava` de app próprio (T-71).
- Quando o app central existir, entra um novo login pelo Strava (ADR-005) sem mexer no conector.
