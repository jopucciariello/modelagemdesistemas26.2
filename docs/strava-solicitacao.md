# Solicitação ao Strava — materiais e conformidade

Requisitos: RF04, RF32–RF34, RNF01, RNF05. App submetido: **app central do GearLog**, caminho principal com dados direto do Strava. O strava-connector é só ponte temporária até a aprovação definitiva (OPEN-22, 16/11/2026). Papel do app por atleta: OPEN-23.

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
| "View on Strava" nos pedais importados | Feito na lista de pedais (fonte Strava) |
| Botão "Connect with Strava" oficial | **Pendente (você):** o download dos assets é bloqueado no meu ambiente. Baixe os ZIPs em developers.strava.com/guidelines, coloque o botão em `public/strava/` e me avise para trocar o botão de texto atual |
| Desconectar e revogar | Feito: `POST /fonte/strava/desconectar` chama `oauth/revoke` e apaga os tokens |
| Token no cliente/conector de terceiro | O conector é do próprio dono do app; ver OPEN-22 |
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

## 4. Estado em 19/11/2026 e o que o usuário faz

Decisão de 19/11 (usuário): pedir ao Strava a autorização para o GearLog receber os atletas **direto no site e no app Expo**. O strava-connector **não é desmontado**; segue como ponte até a aprovação.

**Qual app submeter (recomendado, mais simples):** o app do Strava que o strava-connector já usa, com o *Authorization Callback Domain* trocado de `strava.jopucci.com` para o domínio pai **`jopucci.com`**, que cobre `strava.jopucci.com` e `gearlog.jopucci.com` (o Strava aceita subdomínios do domínio informado; **testar o login nos dois** logo depois da troca). Assim não precisa de outra conta Strava (1 app por conta), as credenciais já estão no Infisical do conector e o conector continua funcionando. Alternativa: um app novo numa segunda conta Strava com assinatura (callback `gearlog.jopucci.com`); só vale se o domínio pai não funcionar.

Callback do GearLog: `https://gearlog.jopucci.com/auth/strava/callback`. O app Expo (iOS e Android) não precisa de callback próprio: o OAuth abre no navegador do sistema, volta ao `gearlog.jopucci.com` e o site devolve ao app por deep link.

### O que você faz (eu não envio nada em seu nome)

1. Em strava.com/settings/api (conta do conector, assinatura ativa): trocar *Authorization Callback Domain* para `jopucci.com`; site `https://gearlog.jopucci.com`; descrição da seção 3. Conferir que o ícone do app não usa partes do logo do Strava.
2. Copiar o mesmo `STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET` para o Infisical do **GearLog** (ambiente que o deploy lê). Avise aqui; sem isso o botão não aparece no site.
3. Baixar os ZIPs oficiais em developers.strava.com/guidelines (botão "Connect with Strava" e logos) e colocar em `public/strava/` do repositório, ou me enviar os arquivos; meu ambiente não alcança o site do Strava.
4. Conectar a sua conta pelo site, ver os pedais entrando e tirar capturas de tela (login/Fonte, lista de pedais com "View on Strava", página de privacidade) para anexar ao formulário.
5. Subir a capacidade a 10 atletas no painel de API; para passar de 10, enviar o [formulário de revisão](https://share.hsforms.com/1VXSwPUYqSH6IxK0y51FjHwcnkd8) colando os textos da seção 3. O formulário é carregado por JavaScript e não consegui ler os campos; confira quais pede.
6. Só depois da aprovação o conector sai da tela.

### O que eu faço em seguida

- Trocar o botão de texto pelo oficial (quando os arquivos existirem).
- Atualizar a política de privacidade quando o app central estiver ativo: hoje ela diz "Não guardamos token do Strava", o que deixa de ser verdade (tokens ficam criptografados, RNF01).
- Testar o fluxo ponta a ponta no site e no Expo.

## 5. Plano de código

1. Feito: credenciais do app central por `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` (Infisical); a opção "Conectar com o Strava" aparece na página Fonte quando ambas existem (RF04, RF32).
2. Feito: link "View on Strava". Pendente: botão e logo oficiais (item 3 acima).
3. Feito: desconectar revoga e apaga tokens (RNF01).
4. Feito: conector marcado como temporário; RF33 removido em 17/11/2026 (OPEN-23).
5. Pendente: privacidade e termos com o token do Strava (ativar junto com o item 2 dos passos).
