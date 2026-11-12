# modelagemdesistemas26.2
# GearLog - Gestão de Desgaste e Manutenção Preventiva de Bicicletas

> Projeto desenvolvido para a disciplina de **Modelagem e Desenvolvimento de Software**.

---

## 🎯 Sobre o Projeto
O **GearLog** é uma aplicação web para ciclistas acompanharem o desgaste real das peças de suas bicicletas com base na quilometragem e nas horas de uso dos pedais (lançados à mão ou importados do **Strava**). O sistema avisa quando cada peça precisa ser trocada ou revisada. Um administrador mantém o catálogo de categorias e componentes.

**Escopo da entrega:** Fase 1, o tracker de desgaste. O mercado de peças e a oficina ficam no [segundo estágio](docs/segundo-estagio.md).

---

## 📚 Documentação do Sistema
Toda a documentação técnica e de engenharia de requisitos do projeto está centralizada na pasta [`/docs`](docs/):

* 📋 [Visão do Produto e Escopo](docs/visao.md)
* 👤 [Personas do Sistema](docs/personas.md)
* 📐 [Especificação de Requisitos (EARS, RNFs e RBs)](docs/requisitos.md)
* 🔭 [Segundo estágio (Fases 2 e 3)](docs/segundo-estagio.md)
* 🧩 [Modelo de domínio](docs/dominio.md)
* 🚴 [Integração com o Strava (contrato do conector)](docs/integracao-strava.md)
* 🏛️ [Decisões de arquitetura (ADR-001 a ADR-007)](docs/adr/)
* ❓ [Decisões em aberto](docs/decisoes-em-aberto.md)
* 🤝 [Combinados de Equipe](docs/combinados.md)
* 📜 [Constituição e Regras de SDD (CLAUDE.md)](CLAUDE.md)

---

## 🛠️ Tecnologias

> Decidido em 06/11/2026 (OPEN-03); o registro completo fica no [ADR-001](docs/adr/ADR-001-stack.md).

* **Linguagem:** TypeScript (frontend e backend)
* **Framework:** Next.js 16 (App Router)
* **Banco de Dados:** SQLite, com Prisma 7
* **Testes:** Vitest
* **Metodologia:** Spec-Driven Development (SDD)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Git
* [Infisical CLI](https://infisical.com/docs/cli/overview), com acesso ao projeto do GearLog em `https://secrets.minson.com.br`
* Node.js 22 (LTS)
* Um *OAuth client ID* do Google (tipo "Web application", no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)) com o redirect `http://localhost:3000/auth/google/callback`. Todos os perfis entram com o Google ([ADR-005](docs/adr/ADR-005-login-unico-google.md))
* Opcional: um app de API no Strava ([strava.com/settings/api](https://www.strava.com/settings/api)) com **Authorization Callback Domain** = `localhost`, só se for testar a fonte "API do Strava" (o app tem um tutorial em `/tutorial-strava`, [ADR-006](docs/adr/ADR-006-fontes-de-pedais.md))

### Instalação e Execução
```bash
# 1. Clonar e instalar (o postinstall gera o cliente Prisma)
git clone https://github.com/jopucciariello/modelagemdesistemas26.2.git
cd modelagemdesistemas26.2
npm install

# 2. Segredos no Infisical (ADR-003): faça login e vincule o repo ao projeto uma vez.
#    O `infisical init` cria o .infisical.json (só o ID do projeto, pode ir para o Git).
infisical login --domain=https://secrets.minson.com.br   # instância própria do Infisical
infisical init
#    No ambiente "dev" do Infisical, cadastre as variáveis listadas em .env.example:
#    DATABASE_URL, APP_URL, GOOGLE_*, ADMIN_EMAILS e TOKEN_ENCRYPTION_KEY
#    (STRAVA_API_BASE_URL é opcional: padrão https://www.strava.com/api/v3)
#    (o comando para gerar a chave está no próprio .env.example)

# 3. Criar o banco SQLite (prisma/dev.db)
npm run db:migrate

# 4. Subir o app em http://localhost:3000 e entrar com o Google.
#    Quem estiver em ADMIN_EMAILS também acessa /admin (catálogo).
npm run dev
```

### Como usar (Fase 1)

| Tela | Quem | O que faz | Requisitos |
|---|---|---|---|
| `/admin` | Admin | Catálogo: categorias, planos padrão (km, horas ou ambos; troca ou revisão; "desgasta em rolo") e componentes. O botão **Carregar catálogo inicial** traz a tabela de vida útil dos requisitos | RF30, RB14–RB16 |
| `/fonte` | Todos | Escolhe a fonte dos pedais: manual, API do Strava com app próprio ou conector | RF32–RF34 |
| `/bikes` | Todos | Cadastra, edita e arquiva bikes | RF01 |
| `/bikes/<id>` | Todos | Instala peças do catálogo (planos sugeridos e editáveis), registra revisão, troca e manutenção manual, mostra o histórico e associa a bike da fonte | RF02, RF03, RF05, RF10–RF12 |
| `/pedais` | Todos | Lança pedal à mão e sincroniza com o Strava ou o conector | RF06, RF13, RF14 |
| `/` | Todos | Painel com todas as peças ordenadas por desgaste e os alertas de 80% e 100% | RF07–RF09, RF15 |

Roteiro rápido de demo sem Strava: entrar como admin, carregar o catálogo inicial, criar uma bike, instalar corrente e garfo, lançar alguns pedais em `/pedais` e ver os alertas no painel.

### Testes
```bash
npm test        # Vitest, uma vez
npm run lint    # ESLint
```

Os scripts `dev`, `start`, `db:migrate` e `db:deploy` já rodam com `infisical run --env=dev --`, que injeta os segredos só no processo. Nenhum segredo fica em arquivo no repositório. Os testes (`npm test`) não precisam de segredos. O `Client Secret` e os tokens do Strava de cada atleta e a chave do conector ficam criptografados no banco (RNF01).

### Deploy (Fly.io)

O app roda no Fly.io com SQLite num volume ([ADR-004](docs/adr/ADR-004-deploy-fly.md)). O deploy é feito pelo GitHub Actions (`.github/workflows/deploy.yml`) a cada push na `main` (e, temporariamente, na `feat/RF04-baseline`), com o `FLY_API_TOKEN` como secret do repositório. O workflow lê o ambiente Production do Infisical por OIDC (sem credencial guardada) e grava os segredos no Fly antes do deploy. Para aplicar um segredo alterado, rode o workflow de novo. Configuração inicial, feita uma vez:

```bash
fly apps create <app>
fly volumes create gearlog_data --region gru --size 1 -a <app>
fly tokens create deploy -a <app> | gh secret set FLY_API_TOKEN   # token de deploy no GitHub
# No GitHub: variables INFISICAL_IDENTITY_ID e INFISICAL_PROJECT_SLUG (identity com OIDC Auth no Infisical)
fly certs add gearlog.jopucci.com -a <app>   # e, no Cloudflare: CNAME gearlog -> <app>.fly.dev, sem proxy
```

Em produção o app atende só em `https://gearlog.jopucci.com`; acessos ao `.fly.dev` são redirecionados.
