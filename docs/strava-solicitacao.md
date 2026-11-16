# Solicitação ao Strava — materiais e conformidade

Requisitos: RF04, RF32–RF34, RNF01, RNF05. Decisão de qual app submeter: ver OPEN-20.

## 1. O que o Strava exige (fontes oficiais, consultadas em 16/11/2026)

- Todo app novo nasce em *single-player* (só a conta dona). Dá para subir a 10 atletas pelo painel de API, sem revisão; passar de 10 exige o [formulário de revisão](https://share.hsforms.com/1VXSwPUYqSH6IxK0y51FjHwcnkd8) ([Getting Started](https://developers.strava.com/docs/getting-started/)).
- Criar app exige assinatura Strava. A revisão não tem prazo nem critérios publicados, e recusas vêm sem explicação ([thread da comunidade](https://communityhub.strava.com/developers-api-7/four-athlete-capacity-requests-four-template-declines-training-app-for-trail-ultra-runners-what-am-i-missing-13845)).
- [Brand Guidelines](https://developers.strava.com/guidelines/): botão "Connect with Strava" (48 px) no OAuth; "Powered by Strava" ou "Compatible with Strava" sem sugerir apoio do Strava; sem "Strava" no nome do app; link "View on Strava" com esse texto exato, em negrito, sublinhado ou #FC5200.
- [API Agreement](https://www.strava.com/legal/api): dados de um atleta só podem ser exibidos a ele mesmo; token de API é de um app só e não pode ser repassado a terceiros; respeitar privacidade e LGPD.

## 2. Conformidade do GearLog

| Exigência | Situação |
|---|---|
| Dados só para o próprio atleta | Atende (cada atleta só vê os seus pedais) |
| Sem GPS, FC, potência etc. | Atende (só data, esporte, distância, tempo, bike) |
| Política de privacidade pública | Feita em `/privacidade` (este PR) |
| "Compatible with Strava" e aviso de não afiliação | Rodapé (este PR); usar o logo oficial é pendência abaixo |
| "View on Strava" nos pedais importados | Pendente: a lista de pedais ainda não mostra link (`Ride.externalId` existe) |
| Botão "Connect with Strava" oficial | Pendente: baixar o ativo em developers.strava.com/guidelines e usar na página Fonte |
| Token no cliente/conector de terceiro | O conector é do próprio dono do app; ver OPEN-20 |
| Retenção/cache de dados | Os pedais ficam no banco (ADR-007). O Agreement não fixa prazo; resumos de terceiros citam 7 dias. **Confirmar** antes de submeter |
| Uso em IA | Nenhum |

## 3. Texto do formulário (rascunho para colar)

- **Nome do app:** GearLog
- **Descrição:** GearLog acompanha o desgaste e a manutenção preventiva das peças de bicicletas (corrente, cassete, pneus, suspensão). Lê do Strava apenas as atividades de ciclismo (data, tipo, distância, tempo em movimento e bike) para somar km e horas às peças instaladas e avisar quando uma peça chega ao limite de revisão.
- **Escopos:** `read`, `profile:read_all` (lista de bikes), `activity:read_all`.
- **Dados não usados:** GPS, frequência cardíaca, potência, fotos, segmentos, kudos, comentários.
- **Quem vê os dados:** só o próprio atleta. Sem compartilhamento, sem IA, sem venda.
- **Exclusão:** o atleta desconecta e apaga tokens e dados no app.
- **URLs:** site https://gearlog.jopucci.com · privacidade https://gearlog.jopucci.com/privacidade · callback `gearlog.jopucci.com`.
- **Contexto:** projeto acadêmico (Modelagem de Sistemas), sem fins comerciais.

## 4. Passos do usuário (o envio exige a conta Strava)

1. Escolher o app (OPEN-20).
2. Em strava.com/settings/api, preencher nome, descrição, site, domínio de callback e logo (sem logo do Strava como ícone).
3. Subir a capacidade a 10 pelo painel; só usar o formulário de revisão se precisar de mais de 10 atletas.
