# Mapa de Specs — GearLog (Fase 1)

Índice ordenado das Specs da Fase 1. Cada Spec é uma **capacidade observável** (fatia vertical), não uma camada. RNFs transversais aparecem nas Specs em que se aplicam. O texto completo, com as 14 seções, está em [specs.md](specs.md).

> **Situação (13/11/2026):** SPEC-001 a SPEC-006 foram escritas depois da implementação inicial, a partir do código e dos requisitos, e conferidas contra o código. Elas aguardam a aprovação do João (OPEN-21). SPEC-007 ainda não foi implementada.

| Ordem | ID | Nome | Objetivo e valor | RF | RB | RNF | UC | Entidades | ADRs | Depende de | Por que nesta posição |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SPEC-001 | Acesso e perfis | Qualquer pessoa entra com o Google; só e-mails autorizados administram | RF04 | RB17 | RNF02 | UC01 | Usuário, Sessão | ADR-002, ADR-005 | — | Tudo depende de saber quem é o usuário e o perfil dele |
| 2 | SPEC-002 | Catálogo do administrador | O admin mantém famílias, componentes e bikes-modelo; o catálogo da planilha entra sozinho | RF30, RF35 (modelos) | RB10, RB15 | — | UC14 | Família, Plano padrão, Componente, Bike-modelo | — | SPEC-001 | Peças só existem a partir do catálogo (RB15) |
| 3 | SPEC-003 | Bikes e peças | O atleta monta a bike (à mão ou de um modelo) e instala peças com planos | RF01, RF02, RF03, RF35 | RB01, RB10, RB15, RB16 | RNF07 | UC03, UC04, UC05 | Bike, Peça, Plano de manutenção | — | SPEC-002 | Sem bike e peça não há o que desgastar |
| 4 | SPEC-004 | Pedais e fontes | Os pedais chegam à mão, pelo Strava do atleta ou pelo conector, e entram na bike certa | RF05, RF06, RF13, RF14, RF32, RF33, RF34 | RB02, RB03, RB08, RB12 | RNF01, RNF05, RNF06 | UC02, UC06, UC07 | Pedal, Conexão Strava, Conexão conector | ADR-003, ADR-006 | SPEC-001, SPEC-003 | O desgaste é calculado a partir dos pedais |
| 5 | SPEC-005 | Desgaste, alertas e painel | O atleta vê quanto cada plano já gastou e é avisado antes do fim | RF07, RF08, RF09, RF15 | RB04, RB11, RB14, RB16 | RNF04, RNF07, RNF08 | UC08 | Plano de manutenção, Pedal | ADR-007 | SPEC-003, SPEC-004 | Precisa de peças e pedais para ter o que calcular |
| 6 | SPEC-006 | Manutenção e histórico | O atleta registra revisões, trocas (de item ou inteira), manutenção manual e revisões na oficina, e vê o histórico | RF10, RF11, RF12, RF36 | RB05, RB13, RB18 | RNF09 | UC09, UC10, UC11, UC12, UC13 | Evento de manutenção, Revisão na oficina | ADR-007 | SPEC-005 | Zerar um plano só faz sentido quando o desgaste existe |
| 7 | SPEC-007 | Pedido de modelo novo | O atleta pede pelo menu de ajuda um componente ou bike-modelo que falta; o admin cadastra | RF31 | RB15 | — | UC15 | Pedido de modelo (novo) | — | SPEC-002, SPEC-003 | Completa o catálogo; não bloqueia o fluxo principal |

RNFs transversais: RNF01 (segredos) em SPEC-004; RNF04 e RNF07 (desempenho e celular) em SPEC-003 e SPEC-005; RNF08 (regra pura testada) em SPEC-005; RNF09 (rastreabilidade) em todas.
