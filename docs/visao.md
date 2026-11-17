# Visão do Produto e Escopo — GearLog

## 1. Problema

Ciclistas não sabem com precisão quando trocar cada peça da bike. Corrente, cassete, pastilhas, pneus e fluido de suspensão se desgastam conforme a quilometragem e as horas de uso. Hoje esse controle é feito "de cabeça", em planilha, ou só quando a peça já falhou. Isso tem três efeitos:

- **Custo maior:** uma corrente gasta, se não for trocada a tempo, destrói cassete e coroas.
- **Risco:** pastilha ou pneu no limite falha em descida ou em prova.
- **Mercado fragmentado:** comprar peça usada ou nova envolve grupos de WhatsApp, marketplaces genéricos e pouca confiança no vendedor.

## 2. Solução proposta

O **GearLog** é uma aplicação web de **gestão de desgaste e manutenção preventiva de bicicletas**. A quilometragem real de cada bike é importada do **Strava**. O sistema calcula o desgaste de cada peça e avisa quando ela se aproxima do fim da vida útil ou do intervalo de revisão. Num segundo estágio, o GearLog poderá ligar esse alerta à compra da peça (marketplace) e ao serviço (oficina).

O GearLog complementa o projeto pessoal **VeloUpgrade-Tracker** (planejamento de upgrades), cobrindo o lado de manutenção e desgaste.

## 3. Escopo

| Fase | Entrega | Perfis envolvidos |
|---|---|---|
| **1 — Tracker de desgaste** | Cadastro de bikes e peças, sincronização de km e horas de uso via Strava, cálculo de desgaste, alertas de troca/revisão, histórico de manutenção | Atleta, Admin (catálogo de peças, RF30) |

**Escopo da entrega (26/11):** a documentação completa (requisitos, casos de uso, domínio, UML, ADRs, Specs) e o MVP cobrem somente a Fase 1, com os perfis Atleta e Administrador, para entregar com qualidade no prazo. As Fases 2 e 3 ficam registradas em [segundo-estagio.md](segundo-estagio.md) só em nível de visão e requisitos, como evolução futura.

**Fonte de km e horas na entrega:** todos entram com o Google e cada atleta escolhe a fonte dos seus pedais: lançamento **manual**, **API do Strava** com app próprio (o GearLog mostra o passo a passo de cadastro) ou **conector** compatível com a API v3 (modos proxy e cache, ver `integracao-strava.md` e o [ADR-006](adr/ADR-006-fontes-de-pedais.md)). Os testes e a demo sem internet usam o mock gerado do Swagger, porque a disciplina exige que a demo rode sem o Strava. Trocar a fonte é só mudar `STRAVA_API_BASE_URL`.

**Segundo estágio (atualizado em 16/11/2026):** João decidiu tentar implementar também o mercado de peças (Fase 2) e a oficina (Fase 3) antes da entrega. A Fase 1 é a entrega garantida; as Fases 2 e 3 só entram em produção sem afetá-la. Visão e personas em [segundo-estagio.md](segundo-estagio.md); a Fase 2 tem requisitos, Specs e ADR próprios.

## 4. Fora de escopo

- Outros equipamentos (motos, calçados, etc.). O GearLog trata **somente bicicletas**.
- Pagamento dentro da plataforma (Fases 2 e 3): a negociação é entre as partes.
- Homologação comercial com o Strava. Por ser projeto acadêmico, cada atleta usa o próprio app do Strava ou o próprio conector. O processo de aprovação da API do Strava só será feito se o produto for profissionalizado.

## 5. Partes interessadas

| Parte | Interesse |
|---|---|
| Atleta | Saber quando trocar ou revisar peças e gastar menos |
| Administrador | Manter o catálogo de peças confiável e atualizado |
| Professor/Disciplina | Avaliar a qualidade da modelagem e da documentação |

> Lojista e Mecânico/Oficina são partes interessadas do [segundo estágio](segundo-estagio.md).

## 6. Restrições

- Integração com o Strava acordada com o professor como fonte de quilometragem.
- Projeto em grupo, com prazo do semestre 2026/2.
- Desenvolvimento orientado por especificação (Spec-Driven Development — ver `CLAUDE.md`).

## 7. Critérios de sucesso (Fase 1)

- O atleta cadastra uma bike e suas peças em menos de 5 minutos.
- A km e as horas de uso da bike são atualizadas a partir do Strava sem digitação manual.
- O sistema emite alerta antes de a peça ultrapassar sua vida útil ou seu intervalo de revisão configurado.
- Toda troca e toda revisão de peça ficam registradas no histórico da bike.
