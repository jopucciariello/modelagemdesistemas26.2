# Segundo Estágio — Mercado de Peças e Oficina

> **Fora da entrega da disciplina (26/11).** Decidido em 06/11/2026: para entregar com qualidade no prazo, o escopo foi reduzido à Fase 1 (acompanhamento de desgaste, perfis Atleta e Administrador). Este documento guarda as Fases 2 e 3 como evolução futura do GearLog, em nível de visão, personas e requisitos. Elas não são modeladas em detalhe (casos de uso, domínio, UML) nem implementadas no MVP.

## 1. Visão

| Fase | Entrega | Perfis envolvidos |
|---|---|---|
| **2 — Mercado de peças** | Mini marketplace com vitrine de lojistas e de usuários comuns, selo de lojista verificado, aba de "sonhos" (preço desejado) com aviso automático | Atleta, Lojista, Admin |
| **3 — Oficina** | Agendamento de revisão com mecânicos/oficinas, registro do serviço no histórico da bike | Atleta, Mecânico/Oficina |

**Fora de escopo também no segundo estágio:** pagamento dentro da plataforma (a negociação no marketplace é feita entre as partes).

**Partes interessadas:** o Lojista quer alcançar ciclistas que precisam de uma peça específica naquele momento. O Mecânico/Oficina quer receber agendamentos já com o histórico da bike. O Administrador quer manter a plataforma confiável (verificação de lojistas e moderação).

## 2. Personas

### Marcos — Lojista

- **Idade:** 41 anos · **Ocupação:** dono de uma loja de bike de bairro
- **Dor:** tem estoque parado e não sabe quem está procurando aquela peça
- **Objetivo:** anunciar peças para ciclistas que realmente precisam delas e ganhar credibilidade online
- **Como o GearLog ajuda:** vitrine própria, selo de lojista verificado e avisos de "sonhos" compatíveis com seus anúncios
- **Fase:** 2

### Cláudia — Mecânica/Oficina

- **Idade:** 35 anos · **Ocupação:** mecânica e dona de uma oficina especializada em suspensão
- **Dor:** o cliente chega sem saber quantos km a bike tem nem quando foi a última revisão
- **Objetivo:** receber agendamentos já com o histórico do equipamento e registrar o serviço feito
- **Como o GearLog ajuda:** agenda de revisões e acesso ao histórico da bike autorizado pelo atleta
- **Fase:** 3

### Beatriz — Administradora (atribuições do segundo estágio)

- Cadastrar e verificar lojistas, conceder o selo e moderar anúncios.

### Matriz persona × funcionalidade (segundo estágio)

| Funcionalidade | Atleta | Lojista | Mecânico | Admin |
|---|:-:|:-:|:-:|:-:|
| Anunciar peça | ✔ | ✔ | | |
| Aba de "sonhos" | ✔ | (recebe aviso) | | |
| Verificar lojista | | | | ✔ |
| Moderar anúncios | | | | ✔ |
| Agendar revisão | ✔ | | ✔ | |
| Registrar serviço | | | ✔ | |

## 3. Requisitos funcionais

### Fase 2 — Mercado de peças

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF16 | O sistema deve permitir que atletas e lojistas publiquem anúncios de peças (título, categoria, condição, preço, fotos, km de uso quando usada). | M |
| RF17 | O sistema deve exibir uma vitrine de anúncios filtrável por categoria, condição, faixa de preço e tipo de vendedor. | M |
| RF18 | O sistema deve permitir que o administrador cadastre lojistas e conceda ou revogue o selo de verificado. | M |
| RF19 | Enquanto um lojista possuir selo de verificado, o sistema deve exibir o selo em seus anúncios e em sua vitrine. | M |
| RF20 | O sistema deve permitir que o atleta cadastre um "sonho": peça desejada com preço máximo. | M |
| RF21 | Quando um anúncio compatível com um sonho for publicado com preço menor ou igual ao preço máximo, o sistema deve notificar o atleta dono do sonho. | M |
| RF22 | Quando um sonho for cadastrado, o sistema deve notificar os lojistas verificados que vendem aquela categoria de peça. | S |
| RF23 | Quando um alerta de "troca próxima" for emitido, o sistema deve sugerir anúncios compatíveis com a peça. | C |
| RF24 | O sistema deve permitir que o administrador remova anúncios que violem as regras da plataforma. | M |

### Fase 3 — Oficina

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF25 | O sistema deve permitir que mecânicos/oficinas cadastrem perfil, serviços oferecidos e horários disponíveis. | M |
| RF26 | O sistema deve permitir que o atleta agende uma revisão em um horário disponível de uma oficina. | M |
| RF27 | Quando o atleta agendar uma revisão, o sistema deve compartilhar com a oficina o histórico daquela bike. | M |
| RF28 | Quando a oficina concluir um serviço, o sistema deve registrar o serviço e as peças trocadas no histórico da bike. | M |

> Nota (13/11/2026, João): as oficinas trabalham com vários níveis de revisão. Na Fase 3, cada oficina cadastrada terá os seus níveis (o que cada um inclui), e a revisão já virá preenchida com o que será e o que foi feito. Na Fase 1, o atleta registra a revisão à mão, item a item (RF36).
| RF29 | Se o atleta cancelar um agendamento com menos de 24 h de antecedência, então o sistema deve notificar a oficina imediatamente. | S |

## 4. Requisitos não funcionais

| ID | Categoria | Requisito (EARS) |
|---|---|---|
| RNF03 | Privacidade (LGPD) | Se um terceiro (oficina) tentar ver o histórico de uma bike sem autorização do atleta, então o sistema deve negar o acesso. |

## 5. Regras de negócio

| ID | Regra |
|---|---|
| RB06 | Apenas o administrador concede o selo de lojista verificado. |
| RB07 | Anúncio de peça usada deve informar a km de uso quando a peça veio do tracker do GearLog (depende dos termos da API do Strava: OPEN-02). |
| RB09 | Uma oficina só acessa o histórico de bikes com agendamento ativo ou concluído com ela. |

## 6. Pontos em aberto

- OPEN-02: termos da API do Strava para exibir a km/horas de uso de uma peça a terceiros (RB07). Ver [decisões em aberto](decisoes-em-aberto.md).
