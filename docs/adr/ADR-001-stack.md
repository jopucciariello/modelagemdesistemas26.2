# ADR-001 — Stack: TypeScript, Next.js, Prisma + SQLite e Vitest

- **Status:** Aceito
- **Data:** 06/11/2026 (decisão); 10/11/2026 (registro)
- **Decisor:** João Pucciariello
- **Resolve:** OPEN-03
- **Requisitos relacionados:** RF04, RNF01, RNF04, RNF06, RNF07, RNF08, RB08

## Contexto

O GearLog precisa entregar a Fase 1 (tracker de desgaste, perfis Atleta e Administrador) até 26/11/2026, com uma pessoa desenvolvendo. A stack precisa:

- integrar com o Strava por OAuth 2.0, guardando os tokens só no backend (RNF01);
- servir uma interface responsiva, usável no celular (RNF07), com carregamento rápido (RNF04);
- permitir testes automatizados das regras de desgaste sem banco e sem UI (RNF08);
- rodar localmente sem infraestrutura extra, inclusive na demo sem Strava (mock ou cache, `docs/integracao-strava.md` §7);
- caber no prazo: uma linguagem só, pouca configuração.

## Decisão

| Camada | Escolha | Versão no baseline |
|---|---|---|
| Linguagem | TypeScript (frontend e backend) | 5.x |
| Framework web | Next.js (App Router), com Route Handlers para o backend | 16.4 |
| Banco de dados | SQLite, arquivo local | — |
| Acesso a dados | Prisma ORM, com o adapter `better-sqlite3` | 7.10 |
| Testes | Vitest | 5.1 |
| Runtime | Node.js LTS | 22 |

Organização do código:

```
src/
  app/            # páginas e Route Handlers (camada de apresentação e API)
  lib/            # serviços e integrações (Strava, sessão, criptografia, banco)
  domain/         # regras de negócio puras (desgaste, alertas) — chegam com as Specs
  generated/      # cliente Prisma gerado (fora do Git)
prisma/           # schema e migrações
tests/            # testes Vitest (unitários, depois integração e contrato)
```

As regras de desgaste (RF07, RB04, RB11, RB16) ficam em funções puras em `src/domain/`, sem depender de Next.js nem do Prisma. É isso que permite cumprir o RNF08.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Backend em FastAPI (Python) + frontend React | Duas linguagens, dois projetos e duas pilhas de teste para uma pessoa só, em três semanas. |
| PostgreSQL | Exige servidor (ou contêiner) para rodar e para a demo. O volume de dados da Fase 1 (uma conta Strava, RB08) cabe em SQLite. O Prisma permite migrar para PostgreSQL trocando o `provider` se o segundo estágio pedir. |
| Jest | Mais configuração para TypeScript e ESM. O Vitest roda TypeScript direto e tem a mesma API. |
| NextAuth / Auth.js para o login | Abstrai o OAuth do Strava, mas a disciplina avalia a integração. O fluxo próprio é curto, testável e deixa explícito onde os tokens são criptografados (RNF01). |

## Consequências

**Positivas**

- Um só repositório e uma só linguagem; `npm run dev` sobe tudo.
- O banco é um arquivo: a demo roda offline e o estado pode ser recriado com `prisma migrate`.
- Os tipos do Prisma e do TypeScript pegam erros de modelo cedo.

**Negativas e riscos**

- SQLite não serve para vários servidores escrevendo ao mesmo tempo. Aceitável na Fase 1 (uma conta, RB08); revisitar no segundo estágio.
- Next.js 16 e Prisma 7 são versões recentes, com APIs que mudaram (Cache Components, `prisma.config.ts`, adapters de driver). O código segue a documentação que vem em `node_modules/next/dist/docs/`.
- Os webhooks do Strava precisam de URL pública. Em desenvolvimento, usar túnel ou só polling (`docs/integracao-strava.md` §4).

## Segurança (RNF01)

- Tokens do Strava criptografados com AES-256-GCM (`TOKEN_ENCRYPTION_KEY`), nunca enviados ao navegador nem gravados em log.
- Sessão por cookie `httpOnly`, `sameSite=lax` e `secure` em produção; o banco guarda só o hash SHA-256 do token da sessão.
- Parâmetro `state` no OAuth contra CSRF.
- Segredos só no `.env`, fora do Git; o repositório tem apenas `.env.example`.
