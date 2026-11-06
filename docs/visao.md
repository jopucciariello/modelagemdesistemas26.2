# Visão do Produto e Escopo — GearLog

## 1. Problema

Ciclistas não sabem com precisão quando trocar cada peça da bike. Corrente, cassete, pastilhas, pneus e fluido de suspensão se desgastam conforme a quilometragem e as horas de uso. Hoje esse controle é feito "de cabeça", em planilha, ou só quando a peça já falhou. Isso tem três efeitos:

- **Custo maior:** uma corrente gasta, se não for trocada a tempo, destrói cassete e coroas.
- **Risco:** pastilha ou pneu no limite falha em descida ou em prova.
- **Mercado fragmentado:** comprar peça usada ou nova envolve grupos de WhatsApp, marketplaces genéricos e pouca confiança no vendedor.

## 2. Solução proposta

O **GearLog** é uma aplicação web de **gestão de desgaste e manutenção preventiva de bicicletas**. A quilometragem real de cada bike é importada do **Strava**. O sistema calcula o desgaste de cada peça e avisa quando ela se aproxima do fim da vida útil. Em fases seguintes, o GearLog liga esse alerta à compra da peça (marketplace) e ao serviço (oficina).

O GearLog complementa o projeto pessoal **VeloUpgrade-Tracker** (planejamento de upgrades), cobrindo o lado de manutenção e desgaste.

## 3. Escopo por fases

| Fase | Entrega | Perfis envolvidos |
|---|---|---|
| **1 — Tracker de desgaste** | Cadastro de bikes e peças, sincronização de km via Strava, cálculo de desgaste, alertas de troca, histórico de manutenção | Atleta |
| **2 — Mercado de peças** | Mini marketplace com vitrine de lojistas e de usuários comuns, selo de lojista verificado, aba de "sonhos" (preço desejado) com aviso automático | Atleta, Lojista, Admin |
| **3 — Oficina** | Agendamento de revisão com mecânicos/oficinas, registro do serviço no histórico da bike | Atleta, Mecânico/Oficina |

**Foco da disciplina:** a documentação cobre as três fases. A implementação prioriza a Fase 1.

## 4. Fora de escopo

- Outros equipamentos (motos, calçados, etc.). O GearLog trata **somente bicicletas**.
- Pagamento dentro da plataforma. A negociação no marketplace é feita entre as partes.
- Homologação comercial com o Strava. Por ser projeto acadêmico, a integração usa apenas os dados da conta do autor. O processo de aprovação da API do Strava só será feito se o produto for profissionalizado.

## 5. Partes interessadas

| Parte | Interesse |
|---|---|
| Atleta | Saber quando trocar peças, gastar menos, comprar e vender peças com confiança |
| Lojista | Alcançar ciclistas que precisam de uma peça específica naquele momento |
| Mecânico/Oficina | Receber agendamentos já com o histórico da bike |
| Administrador | Manter a plataforma confiável (verificação de lojistas, moderação) |
| Professor/Disciplina | Avaliar a qualidade da modelagem e da documentação |

## 6. Restrições

- Integração com o Strava acordada com o professor como fonte de quilometragem.
- Projeto em grupo, com prazo do semestre 2026/2.
- Desenvolvimento orientado por especificação (Spec-Driven Development — ver `CLAUDE.md`).

## 7. Critérios de sucesso (Fase 1)

- O atleta cadastra uma bike e suas peças em menos de 5 minutos.
- A km da bike é atualizada a partir do Strava sem digitação manual.
- O sistema emite alerta antes de a peça ultrapassar sua vida útil configurada.
- Toda troca de peça fica registrada no histórico da bike.
