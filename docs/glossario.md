# Glossário — GearLog

Termos do domínio da Fase 1, em ordem alfabética. Entre parênteses, o nome no código (`prisma/schema.prisma`), quando há.

| Termo | Definição |
|---|---|
| Administrador (`Role.ADMIN`) | Usuário cujo e-mail verificado do Google está em `ADMIN_EMAILS`. Mantém o catálogo e pode ter bikes como qualquer atleta (RB17). |
| Alerta | Aviso de um plano: "troca/revisão próxima" (amarelo) ou "troca/revisão necessária" (vermelho). Aparece no painel e na página da bike; não há notificação por push na Fase 1 (OPEN-14). |
| Amarelo a partir de (`warnKm`, `warnHours`) | Uso em que a barra fica amarela. Vem do mínimo da faixa de durabilidade da planilha; sem ele, vale 80% do intervalo (RB04, OPEN-17). |
| Arquivar | Tirar uma bike do painel sem apagar peças, pedais nem histórico. Pode ser desfeito. |
| Atleta (`Role.ATHLETE`) | Ciclista que cadastra bikes e acompanha o desgaste. Todo usuário que não é administrador. |
| Bike (`Bike`) | Bicicleta do atleta. Pode ter sido criada a partir de uma bike-modelo e pode estar associada a uma bike da fonte pelo `stravaGearId`. |
| Bike da fonte | Bike cadastrada no Strava (gear) que o atleta associa a uma bike do GearLog para os pedais entrarem nela (RF05). |
| Bike-modelo (`BikeModel`) | Bike de fábrica do catálogo, com as peças originais por posição (RF35). |
| Catálogo | Conjunto de famílias, componentes e bikes-modelo mantido pelo administrador. Fonte: a planilha de catálogo, exportada para `src/lib/catalog/seed.json`. |
| Componente (`Component`) | Item do catálogo identificado por código (ex.: `TRX-018`), com marca, modelo, modalidade, faixa de preço e planos próprios. |
| Condição (`ItemCondition`) | Estado de um item informado pelo mecânico numa revisão na oficina: boa, atenção ou trocar em breve (RF36). |
| Conector | Serviço do próprio atleta (ex.: `strava-connector`) que guarda os tokens do Strava e expõe `/v1/gearlog/*` com chave de API (RF34, ADR-006). |
| Desgaste | Fração do intervalo já consumida por um plano: o maior entre km/intervaloKm e horas/intervaloHoras (RF07, RB11). Calculado a cada leitura, nunca gravado (ADR-007). |
| Desgasta em rolo (`wearsOnTrainer`) | Marca da família que diz se pedais `VirtualRide` contam para ela (RB14). |
| Evento de manutenção (`MaintenanceEvent`) | Linha do histórico: troca, revisão ou manutenção manual, com data, descrição e, se veio de uma revisão na oficina, a condição. |
| Família (`Category`) | Grupo de componentes do catálogo: Transmissão, Suspensão, Pneus, Freios, Rodas, Canotes e Selins. Tem planos padrão. |
| Faixa de durabilidade | Mínimo e máximo de vida útil que a planilha dá para um componente. O intervalo é a média; o mínimo vira o "amarelo a partir de". |
| Fonte de pedais (`ActivitySource`) | De onde vêm os pedais do atleta: manual, API do Strava com app próprio ou conector (RF32). |
| Histórico | Lista dos eventos de manutenção de uma bike, do mais recente para o mais antigo, e das peças já trocadas (RF11). |
| Horas em movimento | Tempo em movimento do pedal (`moving_time`), não o tempo total. É a medida de uso em horas (RB12). |
| Intervalo (`intervalKm`, `intervalHours`) | Uso, em km ou horas, em que o plano vence (100%). |
| Montagem (data de) | Data em que as peças originais da bike foram instaladas. Mudá-la move só essas peças. |
| Painel | Tela inicial com todos os planos das bikes ativas, do mais gasto ao menos gasto (RF15). |
| Pedal (`Ride`) | Uma atividade de ciclismo: data, km, horas em movimento e tipo. Lançado à mão ou importado da fonte pelo id externo. |
| Peça (`Part`) | Um componente instalado numa bike, numa data e numa posição. Termina quando é trocada inteira (`removedAt`). |
| Plano de manutenção (`MaintenancePlan`) | Regra de desgaste de uma peça: nome, intervalo em km e/ou horas, amarelo e ação. Uma peça pode ter vários (ex.: corrente e cassete do grupo) (RB16). |
| Plano padrão (`CategoryPlan`) | Plano sugerido pela família para componentes sem plano próprio (RF03). |
| Posição | Lugar da peça na bike: grupo, garfo, amortecedor, pneu dianteiro, pneu traseiro, freios, rodas, canote, selim. |
| Revisão (`PlanAction.SERVICE`) | Ação de um plano que zera só aquele plano sem encerrar a peça (RB13). |
| Revisão na oficina (`ServiceVisit`) | Ida à oficina com vários itens registrados de uma vez, cada um com o que foi feito e a condição (RF36). |
| Sincronização | Busca dos pedais na fonte do atleta. Hoje é manual (botão). Em caso de falha, nada guardado muda (RF13). |
| Troca de item | Troca de um item consumível de uma peça com vários planos (ex.: só a corrente). Zera só aquele plano (RB18). |
| Troca de peça inteira | Encerra a peça antiga e instala uma nova com os mesmos planos, zerados (RF10). |
| Uso inicial (`initialKm`, `initialHours`) | Km e horas que a peça já tinha ao ser instalada (peça usada). Somam até a primeira revisão do plano. |
| `VirtualRide` | Pedal em rolo de treino. Só desgasta famílias marcadas como "desgasta em rolo" (RB14). |
