# ADR-006 — Fonte dos pedais: manual, API do Strava própria ou conector

- **Status:** Proposto (aguarda aprovação da equipe)
- **Data:** 12/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-11, OPEN-12 (propostas)
- **Requisitos relacionados:** RF05, RF06, RF13, RF14, RF32, RF33, RF34, RNF01, RNF06

## Contexto

Com o login único pelo Google (ADR-005), cada atleta precisa dizer de onde vêm os km e as horas dos pedais. O Strava só permite um app por conta, então o GearLog não pode ter um app único para todos.

## Decisão

Cada atleta escolhe uma de três fontes (RF32) e pode trocar depois. A fonte inicial é **manual**.

| Fonte | Como funciona | O que o GearLog guarda (criptografado, RNF01) |
|---|---|---|
| Manual (RF14) | O atleta lança cada pedal à mão | Nada além dos pedais |
| API do Strava (RF33) | O atleta cria o próprio app em strava.com/settings/api, seguindo o tutorial do GearLog (callback domain `gearlog.jopucci.com`), e cola o `Client ID` e o `Client Secret`. O GearLog faz o OAuth 2.0 com o app dele | `Client Secret`, tokens de acesso e de renovação |
| Conector (RF34) | O atleta informa a URL e a chave de API do conector dele. O GearLog lê `/v1/gearlog/status`, `/bikes` e `/activities` | Chave de API |

Regras de segurança:

- `Client Secret`, tokens e chave de API nunca voltam ao navegador (só "configurado").
- A URL do conector só pode ser `https` e não pode apontar para endereço privado ou local (contra SSRF); timeout de 10 s, porque o conector acorda da suspensão.
- Falha de uma fonte não derruba o resto do app (RNF06, RF13).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| App único do Strava no GearLog | Esbarra no limite de um app por conta e na homologação comercial. |
| Só o conector | Obriga todo atleta a ter um conector. |
| Conector global por variável de ambiente | Só serve para um atleta (OPEN-11). |

## Consequências

- O banco ganha a fonte do usuário, as credenciais do app Strava dele e a conexão do conector (migração).
- O GearLog precisa de uma tela de escolha da fonte e de uma página com o tutorial.
- Gravar as atividades no banco e somar km por peça (RF06 completo) fica para uma etapa seguinte.
