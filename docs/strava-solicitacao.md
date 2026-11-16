# Solicitação ao Strava — materiais e conformidade

Requisitos: RF04, RF32–RF34, RNF01, RNF05. App submetido: **app central do GearLog** (OPEN-20, decidido em 16/11/2026).

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

O Strava permite 1 app por conta e a sua conta já tem o app do strava-connector. Por isso o app central precisa de **outra conta Strava com assinatura ativa**.

1. Na conta nova, abrir strava.com/settings/api e criar o app: nome "GearLog", site `https://gearlog.jopucci.com`, domínio de callback `gearlog.jopucci.com`, ícone próprio (sem partes do logo do Strava).
2. Guardar Client ID e Client Secret no Infisical (nunca no repositório) e avisar aqui; o código passa a usar esse app como padrão (PR de seguimento).
3. Subir a capacidade a 10 atletas pelo painel de API (sem revisão).
4. Quando houver o botão oficial, o link "View on Strava" e a política de privacidade no ar, enviar o [formulário de revisão](https://share.hsforms.com/1VXSwPUYqSH6IxK0y51FjHwcnkd8) com os textos da seção 3. Só é necessário para passar de 10 atletas.
5. Sem prazo do Strava: manter o app por atleta (RF33) como plano B até 26/11.
