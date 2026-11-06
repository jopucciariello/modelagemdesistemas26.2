# Especificação de Requisitos — GearLog

Os requisitos funcionais seguem o padrão **EARS** (*Easy Approach to Requirements Syntax*):

| Padrão | Modelo |
|---|---|
| Ubíquo | O sistema deve `<resposta>`. |
| Orientado a evento | Quando `<gatilho>`, o sistema deve `<resposta>`. |
| Orientado a estado | Enquanto `<estado>`, o sistema deve `<resposta>`. |
| Comportamento indesejado | Se `<condição indesejada>`, então o sistema deve `<resposta>`. |
| Opcional | Onde `<recurso estiver presente>`, o sistema deve `<resposta>`. |

Prioridade (MoSCoW): **M** = Must, **S** = Should, **C** = Could.

---

## 1. Requisitos Funcionais

### Fase 1 — Tracker de desgaste

| ID | Requisito (EARS) | Prio |
|---|---|:-:|
| RF01 | O sistema deve permitir que o atleta cadastre, edite e arquive bicicletas (nome, tipo, marca, modelo, ano). | M |
| RF02 | O sistema deve permitir que o atleta cadastre peças em uma bike, informando categoria, marca/modelo, data de instalação, km inicial e vida útil estimada. | M |
| RF03 | Quando o atleta cadastrar uma peça sem informar vida útil, o sistema deve sugerir a vida útil padrão da categoria. | S |
| RF04 | Quando o atleta autorizar a conexão, o sistema deve vincular sua conta Strava via OAuth 2.0. | M |
| RF05 | Quando o atleta vincular o Strava, o sistema deve listar as bikes da conta Strava para associá-las às bikes do GearLog. | M |
| RF06 | Quando uma nova atividade de ciclismo for registrada no Strava, o sistema deve somar a distância e o tempo da atividade à bike associada e às peças instaladas nela. | M |
| RF07 | O sistema deve calcular o desgaste de cada peça como percentual da vida útil consumida. | M |
| RF08 | Quando o desgaste de uma peça atingir 80%, o sistema deve emitir um alerta de "troca próxima". | M |
| RF09 | Quando o desgaste de uma peça atingir 100%, o sistema deve emitir um alerta de "troca necessária". | M |
| RF10 | Quando o atleta registrar a troca de uma peça, o sistema deve encerrar a peça antiga, registrá-la no histórico e iniciar a nova com km zerado. | M |
| RF11 | O sistema deve exibir o histórico de manutenção de cada bike em ordem cronológica. | M |
| RF12 | O sistema deve permitir que o atleta registre manutenção manual (ex.: lubrificação, sangria de freio) sem troca de peça. | S |
| RF13 | Se a sincronização com o Strava falhar, então o sistema deve manter os dados anteriores, registrar a falha e permitir nova tentativa manual. | M |
| RF14 | Onde o Strava não estiver vinculado, o sistema deve permitir que o atleta informe a km manualmente. | S |
| RF15 | O sistema deve exibir um painel com as peças de todas as bikes ordenadas por desgaste. | S |

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
| RF29 | Se o atleta cancelar um agendamento com menos de 24 h de antecedência, então o sistema deve notificar a oficina imediatamente. | S |

---

## 2. Requisitos Não Funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Segurança | A autenticação com o Strava deve usar OAuth 2.0; tokens devem ser armazenados criptografados e nunca expostos ao frontend. |
| RNF02 | Segurança | Senhas devem ser armazenadas com hash (bcrypt ou argon2). |
| RNF03 | Privacidade (LGPD) | O histórico de uma bike só pode ser visto por terceiros (oficina) com autorização do atleta. |
| RNF04 | Desempenho | Páginas principais devem carregar em até 2 s em conexão 4G. |
| RNF05 | Integração | O sistema deve respeitar os limites de requisição da API do Strava e usar webhooks quando disponíveis, com polling como alternativa. |
| RNF06 | Disponibilidade | Uma falha do Strava não pode impedir o uso das demais funções do sistema. |
| RNF07 | Usabilidade | A interface deve ser responsiva e utilizável em celular. |
| RNF08 | Manutenibilidade | O código deve seguir as convenções definidas em `CLAUDE.md`, com testes para as regras de cálculo de desgaste. |
| RNF09 | Rastreabilidade | Todo requisito deve ser rastreável até caso de uso, código e teste. |

---

## 3. Regras de Negócio

| ID | Regra |
|---|---|
| RB01 | Uma peça pertence a no máximo uma bike por vez. |
| RB02 | A km só é somada às peças que estavam instaladas na data da atividade. |
| RB03 | Somente atividades do tipo ciclismo (estrada, MTB, gravel, virtual quando aplicável) contam para o desgaste. |
| RB04 | Limiares de alerta: 80% da vida útil = troca próxima; 100% = troca necessária. |
| RB05 | Uma peça trocada não pode ser excluída, apenas arquivada no histórico. |
| RB06 | Apenas o administrador concede o selo de lojista verificado. |
| RB07 | Anúncio de peça usada deve informar a km de uso quando a peça veio do tracker do GearLog. |
| RB08 | Por ser projeto acadêmico, a integração Strava opera apenas com a conta do autor do projeto. |
| RB09 | Uma oficina só acessa o histórico de bikes com agendamento ativo ou concluído com ela. |

---

## 4. Vida útil padrão sugerida (referência para RF03)

Valores de partida, editáveis pelo atleta.

| Categoria | Vida útil padrão |
|---|---|
| Corrente | 3.000 km |
| Cassete | 9.000 km |
| Pneu de estrada | 4.000 km |
| Pneu de MTB | 2.500 km |
| Pastilha de freio | 1.500 km |
| Cabo e conduíte | 5.000 km |
| Fluido de suspensão (revisão) | 50 h |
