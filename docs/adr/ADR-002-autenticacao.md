# ADR-002 — Autenticação: atleta pelo Strava, administrador pelo Google

- **Status:** Aceito
- **Data:** 12/11/2026
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-09
- **Requisitos relacionados:** RF04, RF30, RF31, RNF01, RNF02, RB08, RB17

## Contexto

A Fase 1 tem dois perfis com permissões diferentes (OPEN-06): **Atleta** e **Administrador**. O baseline (ADR-001) já tinha o login do atleta pelo Strava. Faltava decidir como o administrador entra e como alguém vira administrador. O RNF02 previa senhas com hash, mas guardar senhas traz cadastro, recuperação de senha e risco de vazamento, sem ganho para um projeto com poucos administradores.

## Decisão

| Perfil | Como entra | Onde | Quem pode |
|---|---|---|---|
| Atleta | OAuth 2.0 do Strava (RF04). A conta é criada no primeiro acesso. | `/` | A conta Strava do autor (Single Player Mode, RB08) |
| Administrador | Login com Google (OpenID Connect) | `/admin` | Só os e-mails Google verificados que estão em `ADMIN_EMAILS` (RB17) |

Detalhes do login do administrador:

- Fluxo *authorization code* com **PKCE (S256)**, `state` contra CSRF e `nonce` contra replay. Escopos: `openid email profile`.
- O `id_token` vem direto do endpoint de token do Google, por TLS e autenticado com o `client_secret`. Por isso (OpenID Connect Core §3.1.3.7) a assinatura não é revalidada; o GearLog confere `iss`, `aud`, `exp`, `nonce` e exige `email_verified = true`.
- A lista de administradores fica na variável `ADMIN_EMAILS`, guardada no Infisical (ADR-003), com os e-mails separados por vírgula, sem diferenciar maiúsculas). Cadastrar um administrador é incluir o e-mail na lista no Infisical; descadastrar é tirar.
- A permissão é conferida **a cada requisição** em `/admin`: se o e-mail sair da lista, a sessão perde o acesso na hora, mesmo que ainda esteja válida.
- Um e-mail fora da lista não cria conta nem sessão. O motivo da recusa vai para o log só como código (`not_authorized`), sem o e-mail.
- O GearLog **não guarda senhas** e não guarda tokens do Google (só usa o `id_token` no login).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Usuário e senha com bcrypt/argon2 (RNF02 original) | Exige cadastro, troca e recuperação de senha, e passa a guardar um segredo sensível. Mais código e mais superfície de ataque. |
| Administrador também pelo Strava | O Strava em Single Player Mode só aceita a conta do autor (RB08), então não dá para ter administradores diferentes do atleta. |
| Lista de administradores no banco, editável por tela | Precisa de uma tela e de um primeiro administrador "semente". Para a Fase 1, a variável de ambiente basta; pode virar tabela no segundo estágio. |
| Auth.js / NextAuth | Mesmo motivo do ADR-001: o fluxo próprio é curto, testável e deixa explícitas as checagens de segurança. |

## Consequências

- O RNF02 muda: em vez de guardar hash de senha, o sistema não guarda senhas (ver `requisitos.md`).
- É preciso criar um *OAuth client ID* do tipo "Web application" no Google Cloud Console, com o redirect `http://localhost:3000/auth/google/callback`. Enquanto o app estiver em modo de teste no Google, os administradores também precisam estar na lista de *test users* da tela de consentimento.
- Atleta e administrador são usuários diferentes no banco, mesmo que sejam a mesma pessoa.
- Mudar a lista de administradores no Infisical só vale depois de reiniciar o app local ou, em produção, de rodar o workflow de deploy de novo (ADR-004).
