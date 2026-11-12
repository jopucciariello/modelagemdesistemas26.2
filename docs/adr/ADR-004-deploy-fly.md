# ADR-004 — Hospedagem no Fly.io

- **Status:** Aceito
- **Data:** 12/11/2026
- **Decisor:** João Pucciariello
- **Requisitos relacionados:** RF04, RNF01, RNF04, RNF06, RB08, RB17; ADR-001 (SQLite), ADR-002 (callbacks OAuth), ADR-003 (segredos)

## Contexto

Para a demo e para testar o OAuth do Strava e do Google com uma URL fixa, o GearLog precisa rodar fora da máquina de desenvolvimento. João já tem conta no Fly.io.

## Decisão

- O app roda no **Fly.io**, região `gru` (São Paulo), a partir do `Dockerfile` do repositório (Node 22).
- O banco SQLite (ADR-001) fica num **volume do Fly** montado em `/data`, com `DATABASE_URL = file:/data/gearlog.db`.
- Ao subir, o contêiner roda `prisma migrate deploy` e depois `next start`.
- Roda **uma única máquina**, porque o SQLite não aceita várias instâncias escrevendo no mesmo arquivo. A máquina para sozinha quando não há acesso (`auto_stop_machines`) e liga na próxima requisição.
- Os segredos ficam no ambiente **Production** do Infisical (ADR-003) e são copiados para o Fly com:
  `infisical export --env=prod --format=dotenv | fly secrets import`
- URLs de produção: `APP_URL = https://<app>.fly.dev`, e os callbacks `https://<app>.fly.dev/auth/strava/callback` e `https://<app>.fly.dev/auth/google/callback`. No Strava, o *Authorization Callback Domain* passa a ser `<app>.fly.dev` (o Strava sempre libera `localhost` também). No Google, o redirect de produção é incluído junto com o de `localhost`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Vercel | Não tem disco persistente para o SQLite. Exigiria trocar o banco (ADR-001). |
| Render ou Railway | Também serviriam, mas João já usa o Fly. |
| Só local, com túnel (ngrok) | A URL muda a cada sessão e quebra os callbacks do OAuth. |

## Consequências

- Uma máquina só significa que não há alta disponibilidade. Isso é aceitável na Fase 1 (uma conta Strava, RB08).
- A primeira requisição depois de um tempo parado demora alguns segundos (*cold start*), o que pesa contra o RNF04. Na apresentação, é bom acessar o app antes de começar.
- O volume precisa de backup manual (`fly volumes snapshots`). Os dados da demo podem ser recriados a partir do Strava.
- A imagem leva as dependências de desenvolvimento (o Prisma CLI é usado no `migrate deploy`) e tem cerca de 1,7 GB. Dá para enxugar depois com o modo `standalone` do Next.js.
