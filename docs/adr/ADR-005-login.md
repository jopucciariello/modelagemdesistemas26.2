# ADR-005 — Login: Google, usuário e senha e (depois) Strava

- **Status:** Aceito (17/11/2026)
- **Data:** 12/11/2026; reescrito em 17/11/2026
- **Decisor:** João Pucciariello
- **Substitui:** o antigo ADR-002 (autenticação), fundido aqui em 17/11/2026 (OPEN-19)
- **Resolve:** OPEN-09, OPEN-10
- **Requisitos relacionados:** RF04, RF30, RF37, RNF01, RNF02, RB17

## Contexto

O baseline previa login do atleta só pelo Strava e do administrador pelo Google. O Strava só permite **um app por conta**, e o app do autor já é do strava-connector (`redirect_uri invalid`), então o login pelo Strava ainda não é possível. Por isso o login passou a ser pelo Google (12/11/2026). Em 17/11/2026 João ampliou: o usuário também pode entrar com usuário e senha, e com o Strava quando o Strava aprovar o app central do GearLog.

## Decisão

| Forma de entrar | Estado | Observação |
|---|---|---|
| Google (OpenID Connect) | Feito | `/auth/google`, PKCE S256, `state`, `nonce`, `email_verified` obrigatório |
| Usuário e senha | A fazer (T-70) | Cadastro aberto; senha com hash scrypt e sal por usuário (RNF02); limite de tentativas |
| Strava | Quando o Strava aprovar o app central | Vira login e vínculo ao mesmo tempo; até lá o Strava é só fonte de pedais (ADR-006) |

| Perfil | Como é definido |
|---|---|
| Administrador | E-mail verificado em `ADMIN_EMAILS` (RB17), conferido a cada requisição em `/admin` |
| Atleta | Qualquer outra pessoa que se cadastre (OPEN-10) |
| Lojista, oficina e mecânico | Não são papéis de login: são perfis aprovados pelo administrador (ADR-008, ADR-009) |

**Lista de administradores (`ADMIN_EMAILS`).** Fica no Infisical (instância própria, `https://secrets.minson.com.br`). A tela `/admin` deixa o administrador incluir e-mails (RF37). Gravar direto no Infisical a partir do app exige uma credencial de escrita no cofre dentro do servidor de produção, o que vai contra o desenho do ADR-004 (só o deploy lê o Infisical, por OIDC, sem credencial guardada). Por isso a escolha mais simples e segura é: a tela grava os e-mails extras no **banco** (`AdminEmail`), e a checagem de administrador vale para `ADMIN_EMAILS` **ou** essa tabela; o Infisical continua com os administradores "raiz". João aprovou esse desenho em 17/11/2026 (OPEN-45).

Detalhes do login Google (inalterados): *authorization code* com PKCE, `state` e `nonce`; o `id_token` vem do endpoint de token por TLS, então a assinatura não é revalidada (OIDC Core §3.1.3.7) e o GearLog confere `iss`, `aud`, `exp`, `nonce` e `email_verified`. Um administrador fora da lista perde o acesso na hora. O GearLog não guarda tokens do Google.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Só Google | Quem não tem ou não quer usar Google ficaria de fora (pedido de João em 17/11). |
| Só Strava | Colide com o app único já usado pelo conector. |
| Auth.js / NextAuth | O fluxo próprio é curto e testável (ADR-001). |
| Gravar `ADMIN_EMAILS` no Infisical pelo app | Põe uma credencial de escrita do cofre no servidor de produção. |

## Consequências

- O RNF02 volta a prever senha, mas só como hash (scrypt); quem usa Google ou Strava não tem senha.
- Contas de senha precisam de e-mail verificado para virar administrador: só o login por Google ou e-mail confirmado conta para `ADMIN_EMAILS`.
- Atleta e administrador continuam sendo usuários diferentes no banco.
- Mudar `ADMIN_EMAILS` no Infisical só vale depois de rodar o deploy de novo (ADR-004).
