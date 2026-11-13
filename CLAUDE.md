# Constituição do Projeto — GearLog (Spec-Driven Development)

Este arquivo define as regras do projeto para pessoas e agentes de IA que trabalham no repositório.

## Princípios

1. **Spec antes do código.** Nenhuma funcionalidade é implementada sem requisito correspondente em `docs/requisitos.md`.
2. **Rastreabilidade.** Todo commit, PR e teste referencia o ID do requisito (ex.: `RF08`, `RB04`); commits e PRs também citam a issue.
3. **Decisões registradas.** Toda decisão técnica relevante vira um ADR em `docs/adr/`.
4. **Escopo fechado.** O GearLog trata somente bicicletas. Mudança de escopo exige atualização de `docs/visao.md` antes.
5. **Fase 1 primeiro.** Nada da Fase 2 ou 3 é implementado antes de a Fase 1 estar funcional.

## Fluxo de trabalho

1. Escrever ou ajustar o requisito em EARS.
2. Atualizar caso de uso e modelo de domínio, se afetados.
3. Escrever o teste a partir do requisito.
4. Implementar.
5. Abrir PR citando os IDs e a issue; o PR é revisado antes do merge (ver `docs/combinados.md`).

## Convenções

- Idioma da documentação: português. Código, nomes de variáveis e commits em inglês.
- Commits no padrão Conventional Commits, com requisito e issue: `feat(RF06): sync strava activities (#12)`.
- Branches: `feat/RFxx-descricao`, `docs/descricao`, `fix/descricao`.

## Estrutura da documentação

```
docs/
  visao.md          # visão do produto e escopo
  personas.md       # personas e perfis
  requisitos.md     # RFs (EARS), RNFs, RBs
  combinados.md     # acordos da equipe
  integracao-strava.md  # contrato do conector Strava
  decisoes-em-aberto.md # questões em aberto (OPEN-XX)
  api/strava-subset.yaml # Swagger recortado do Strava (testes de contrato)
  dominio.md        # modelo conceitual de domínio
  casos-de-uso.md   # casos de uso
  arquitetura.md    # drivers arquiteturais e documento consolidado
  uml.md            # diagramas de classes e de sequência
  glossario.md      # glossário do domínio
  mapa-specs.md     # mapa ordenado das Specs
  specs.md          # Specs SPEC-001.. (14 seções)
  testes.md         # estratégia de testes e evidências
  review/           # revisão: arquitetura, desempenho, segurança, observabilidade
  adr/              # Architecture Decision Records (ADR-001, ...)
spec.md, plan.md, tasks.md  # na raiz: fonte de verdade, plano técnico e tarefas
.specify/           # constituição resumida e modelos de Spec e tarefa
```

## Restrições para agentes de IA

- Não inventar requisitos: propor e marcar como `[PROPOSTO]` até aprovação da equipe.
- Não preencher lacunas em silêncio: registrar como `OPEN-XX` em `docs/decisoes-em-aberto.md`.
- Não expor tokens ou segredos do Strava em código, logs ou documentação.
