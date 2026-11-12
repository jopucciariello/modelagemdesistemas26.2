# ADR-007 — Desgaste calculado a partir dos pedais guardados

- **Status:** Proposto (aguarda aprovação da equipe)
- **Data:** 12/11/2026
- **Decisor:** João Pucciariello
- **Requisitos relacionados:** RF06, RF07, RF10, RF13, RF14, RB02, RB13, RB14, RB16, RNF08

## Contexto

O RF06 pede que os km e as horas de cada pedal sejam somados às peças que estavam instaladas na data do pedal (RB02). Os pedais chegam por três fontes (ADR-006) e podem ser editados, apagados ou chegar de novo numa nova sincronização. A peça pode ter vários planos, cada um com a sua revisão (RB13, RB16).

## Decisão

O GearLog **guarda cada pedal** (tabela `Ride`) e **calcula** o uso de cada plano na hora de exibir, somando os pedais da bike dentro do período do plano. Não há contador acumulado na peça.

- Pedais da fonte externa são gravados com o id da atividade (`externalId`), único por atleta. Sincronizar de novo atualiza o pedal em vez de duplicar.
- O cálculo é uma função pura (`src/lib/wear.ts`), testada sem banco e sem UI (RNF08).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Contador de km/horas em cada peça, incrementado a cada pedal | Erra quando um pedal é editado, apagado, reimportado ou lançado com data antiga; exige desfazer somas. |
| Ler os pedais direto do Strava a cada tela | Gasta o limite de requisições (RNF05) e para de funcionar se o Strava cair (RNF06). |

## Consequências

- A tela soma os pedais a cada acesso. Com SQLite e o volume de um atleta (centenas de pedais por ano) isso é instantâneo; se crescer, dá para guardar um resumo por bike e mês.
- Mudar a data de instalação ou de uma revisão recalcula tudo, sem migração de dados.
- Falha na sincronização não altera nada do que já está guardado (RF13).
