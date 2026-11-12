# modelagemdesistemas26.2
# GearLog - Gestão de Desgaste e Manutenção Preventiva de Bicicletas

> Projeto desenvolvido para a disciplina de **Modelagem e Desenvolvimento de Software**.

---

## 🎯 Sobre o Projeto
O **GearLog** é uma aplicação web para ciclistas acompanharem o desgaste real das peças de suas bicicletas com base na quilometragem e nas horas de uso importadas do **Strava**. O sistema avisa quando cada peça precisa ser trocada ou revisada. Um administrador mantém o catálogo de categorias e componentes.

**Escopo da entrega:** Fase 1, o tracker de desgaste. O mercado de peças e a oficina ficam no [segundo estágio](docs/segundo-estagio.md).

---

## 📚 Documentação do Sistema
Toda a documentação técnica e de engenharia de requisitos do projeto está centralizada na pasta [`/docs`](docs/):

* 📋 [Visão do Produto e Escopo](docs/visao.md)
* 👤 [Personas do Sistema](docs/personas.md)
* 📐 [Especificação de Requisitos (EARS, RNFs e RBs)](docs/requisitos.md)
* 🔭 [Segundo estágio (Fases 2 e 3)](docs/segundo-estagio.md)
* 🚴 [Integração com o Strava (contrato do conector)](docs/integracao-strava.md)
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
* Node.js 22 (LTS)
* Um app de API no Strava ([strava.com/settings/api](https://www.strava.com/settings/api)) com **Authorization Callback Domain** = `localhost`

### Instalação e Execução
```bash
# 1. Clonar e instalar (o postinstall gera o cliente Prisma)
git clone https://github.com/jopucciariello/modelagemdesistemas26.2.git
cd modelagemdesistemas26.2
npm install

# 2. Configurar o ambiente: copie e preencha STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
#    e TOKEN_ENCRYPTION_KEY (o comando para gerar a chave está no próprio arquivo)
cp .env.example .env

# 3. Criar o banco SQLite (prisma/dev.db)
npm run db:migrate

# 4. Subir o app em http://localhost:3000 e clicar em "Conectar com o Strava"
npm run dev
```

### Testes
```bash
npm test        # Vitest, uma vez
npm run lint    # ESLint
```

O `.env` nunca vai para o Git. Os tokens do Strava ficam criptografados no banco (RNF01).
