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

> Decidido em 06/11/2026 (OPEN-03); o registro completo fica no ADR-001.

* **Linguagem:** TypeScript (frontend e backend)
* **Framework:** Next.js
* **Banco de Dados:** SQLite, com Prisma
* **Testes:** Vitest
* **Metodologia:** Spec-Driven Development (SDD)

---

## 🚀 Como Executar o Projeto

*(Ambiente de desenvolvimento em configuração inicial)*

### Pré-requisitos
* Git
* Node.js (LTS)

### Instalação e Execução
```bash
# 1. Clonar o repositório
git clone https://github.com/jopucciariello/modelagemdesistemas26.2.git

# 2. Acessar a pasta
cd modelagemdesistemas26.2

# 3. Instruções de inicialização do backend e frontend serão adicionadas na Fase de Implementação.
```
