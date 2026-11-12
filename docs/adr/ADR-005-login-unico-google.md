# ADR-005 — Login único pelo Google

- **Status:** Proposto (aguarda aprovação da equipe)
- **Data:** 12/11/2026
- **Decisor:** João Pucciariello
- **Substitui em parte:** [ADR-002](ADR-002-autenticacao.md)
- **Resolve:** OPEN-10 (proposta)
- **Requisitos relacionados:** RF04, RF30, RNF02, RB08, RB17

## Contexto

O ADR-002 previa o login do atleta pelo Strava. Isso exige um app do Strava com o domínio do GearLog como callback, e o Strava só permite **um app por conta**. O app do autor já é usado pelo strava-connector (domínio `strava.jopucci.com`), então o login pelo Strava do GearLog colide com ele (`redirect_uri invalid`).

## Decisão

Todo usuário entra pelo **Google (OpenID Connect)**, no mesmo fluxo já implementado para o administrador (`/auth/google`, PKCE S256, `state`, `nonce`, `email_verified`).

| Perfil | Como é definido |
|---|---|
| Administrador | E-mail verificado em `ADMIN_EMAILS` (RB17), conferido a cada acesso em `/admin` |
| Atleta | Qualquer outro e-mail Google verificado (OPEN-10, **[PROPOSTO]**) |

O vínculo com o Strava deixa de ser login: passa a ser uma das fontes de pedais do atleta (ADR-006).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter o login pelo Strava | Colide com o app único do Strava já usado pelo conector. |
| Registrar um segundo app do Strava com outra conta | Contorna a regra do Strava e prende o projeto a uma conta extra. |
| Usuário e senha | Mesmos motivos do ADR-002. |

## Consequências

- O GearLog não guarda senha nem depende de app do Strava para entrar.
- A rota `/auth/strava` deixa de ser login e vira "vincular Strava" (ADR-006).
- O RB08 muda: cada atleta usa o próprio app ou o próprio conector.
- `ADMIN_EMAILS` continua valendo; atleta e administrador continuam sendo usuários diferentes no banco.
