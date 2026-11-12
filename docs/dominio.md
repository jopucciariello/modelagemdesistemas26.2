# Modelo de Domínio — GearLog (Fase 1)

Modelo conceitual do tracker de desgaste. Cobre só a Fase 1 (escopo da entrega). Os nomes entre parênteses são os nomes no código (`prisma/schema.prisma`).

## Diagrama

```mermaid
classDiagram
  direction LR

  class Usuario["Usuário (User)"] {
    nome
    email
    perfil: ATLETA | ADMIN
    fonteDePedais: MANUAL | STRAVA | CONECTOR
    ultimaSincronizacao
    ultimoErroDeSincronizacao
  }
  class Categoria["Categoria (Category)"] {
    nome
    desgastaEmRolo
    ativa
  }
  class PlanoPadrao["Plano padrão (CategoryPlan)"] {
    nome
    intervaloKm?
    intervaloHoras?
    acao: TROCA | REVISAO
  }
  class Componente["Componente (Component)"] {
    marca
    modelo
    ativo
  }
  class Bike {
    nome
    tipo
    marca
    modelo
    ano
    idDoStrava?
    arquivadaEm?
  }
  class Peca["Peça (Part)"] {
    instaladaEm
    removidaEm?
    kmIniciais
    horasIniciais
  }
  class PlanoDaPeca["Plano de manutenção (MaintenancePlan)"] {
    nome
    intervaloKm?
    intervaloHoras?
    acao: TROCA | REVISAO
    ultimaRevisaoEm?
  }
  class Pedal["Pedal (Ride)"] {
    origem: MANUAL | STRAVA | CONECTOR
    idExterno?
    tipoDeEsporte
    data
    km
    horasEmMovimento
  }
  class Evento["Evento de manutenção (MaintenanceEvent)"] {
    tipo: TROCA | REVISAO | MANUAL
    data
    descricao
  }

  Categoria "1" *-- "1..*" PlanoPadrao
  Categoria "1" o-- "0..*" Componente
  Usuario "1" o-- "0..*" Bike : atleta
  Usuario "1" o-- "0..*" Pedal
  Bike "1" o-- "0..*" Peca
  Bike "0..1" o-- "0..*" Pedal
  Componente "1" -- "0..*" Peca
  Peca "1" *-- "1..*" PlanoDaPeca
  Bike "1" o-- "0..*" Evento
  Peca "0..1" -- "0..*" Evento
```

## Conceitos

| Conceito | Descrição | Regras |
|---|---|---|
| Categoria | Tipo de peça no catálogo (corrente, garfo…). Mantida só pelo administrador. | RF30, RB10, RB14, RB15 |
| Plano padrão | Intervalo sugerido da categoria (em km, em horas ou nos dois) e a ação ao vencer. | RF03, RB10, RB13 |
| Componente | Marca e modelo de uma categoria (ex.: Shimano CN-M8100). | RF30, RB15 |
| Bike | Bicicleta do atleta. Pode ser associada a uma bike do Strava/conector pelo `idDoStrava`. Arquivar não apaga. | RF01, RF05 |
| Peça | Um componente instalado numa bike numa data. Encerra quando é trocada (`removidaEm`). | RF02, RF10, RB01, RB05 |
| Plano de manutenção | Cópia do plano padrão na peça, editável pelo atleta. O desgaste e os alertas valem por plano. | RB16, RF07–RF09 |
| Pedal | Uma atividade de ciclismo, lançada à mão ou trazida da fonte do atleta. | RF06, RF14, RB02, RB03, RB12 |
| Evento de manutenção | Linha do histórico da bike: troca, revisão ou manutenção manual. | RF10–RF12 |

## Como o desgaste é calculado (RF06, RF07)

O uso de cada plano é **calculado a partir dos pedais guardados**, não somado num contador (ver [ADR-007](adr/ADR-007-desgaste-calculado-dos-pedais.md)):

1. Entram os pedais da bike da peça com data **a partir** do início do plano e **antes** da remoção da peça (RB02). O início do plano é a última revisão (RB13) ou, se nunca houve revisão, a instalação da peça.
2. Pedais `VirtualRide` só entram se a categoria "desgasta em rolo" (RB14).
3. Se o plano nunca foi revisado, somam-se os km e as horas iniciais da peça.
4. Desgaste do plano = maior entre `km / intervaloKm` e `horas / intervaloHoras` (RF07, RB11).
5. Status: abaixo de 80% ok; de 80% "troca/revisão próxima" (RF08); de 100% "troca/revisão necessária" (RF09). O texto depende da ação do plano (RB04, RB13).
