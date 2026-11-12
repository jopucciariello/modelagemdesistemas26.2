# ADR-003 — Segredos e configuração no Infisical

- **Status:** Aceito
- **Data:** 12/11/2026
- **Decisor:** João Pucciariello
- **Requisitos relacionados:** RNF01, RB17, `docs/integracao-strava.md` §9, restrição do `CLAUDE.md` ("não expor tokens ou segredos do Strava")

## Contexto

O GearLog depende de segredos: o *client secret* do Strava e o do Google, a chave que criptografa os tokens do Strava (`TOKEN_ENCRYPTION_KEY`, RNF01) e a lista de administradores (`ADMIN_EMAILS`, RB17). No baseline eles ficavam num arquivo `.env` local, fora do Git. Um arquivo local se perde, é copiado à mão entre máquinas e pode ser commitado por engano. João já usa o Infisical para guardar segredos.

## Decisão

- Todas as variáveis da aplicação ficam no **Infisical**, no projeto do GearLog, ambiente **`dev`**.
- Os comandos que precisam delas rodam com `infisical run --env=dev -- <comando>`, que injeta as variáveis só no processo, sem gravar arquivo. Os scripts `npm run dev`, `start`, `db:migrate` e `db:deploy` já fazem isso.
- O repositório tem o `.infisical.json` (criado por `infisical init`, só com o ID do projeto, sem segredos) e o `.env.example`, que lista os nomes das variáveis sem valores.
- Não se cria `.env`. Ele continua no `.gitignore` como proteção.
- O código só lê `process.env`, então não depende do Infisical. Trocar de cofre não muda o código.
- Os testes automatizados (`npm test`) não precisam de segredo nenhum: usam valores falsos e `fetch` simulado.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `.env` local (baseline) | Fica só numa máquina, é copiado à mão e corre o risco de ir para o Git. |
| SDK do Infisical dentro do app | Acopla o código ao fornecedor e exige um token de máquina no próprio app. O `infisical run` resolve sem mudar o código. |
| Segredos do GitHub Actions | Servem só para o CI, não para o desenvolvimento local. Se o CI precisar de segredos, ele pode ler do Infisical com um *machine identity*. |

## Consequências

- Quem roda o projeto precisa do Infisical CLI, de `infisical login` e de acesso ao projeto.
- Mudar um segredo (ex.: incluir um e-mail em `ADMIN_EMAILS`) exige reiniciar o processo.
- Para outro ambiente (ex.: `prod` na apresentação), basta criar o ambiente no Infisical e rodar com `--env=prod`.
