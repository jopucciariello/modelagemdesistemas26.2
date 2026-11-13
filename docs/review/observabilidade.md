# Revisão de observabilidade

## Situação

- Logs vão para a saída padrão e ficam no `fly logs`. Os erros de login, OAuth do Strava, conector e sincronização registram só um **código** (`[sync] connector failed: unauthorized`), nunca token ou chave.
- A última sincronização e o último erro ficam no usuário (`lastSyncAt`, `lastSyncError`) e aparecem na página de pedais (RF13).
- O Fly checa `GET /` a cada 30 s.
- O GitHub Actions guarda o histórico de CI e deploy.

## Achados

| # | Achado | Severidade | Ação |
|---|---|---|---|
| O1 | Sem registro de qual versão está no ar | Baixa | **Feito:** o deploy só roda depois do CI, e cada execução do workflow aponta o commit publicado |
| O2 | Logs sem formato estruturado nem identificador de requisição | Baixa | Aceito na Fase 1; prefixos `[google-login]`, `[strava-oauth]`, `[connector]`, `[sync]` permitem filtrar |
| O3 | Sem alerta quando o deploy ou o health check falham | Baixa | O GitHub avisa o dono quando um workflow falha; alerta do Fly fica para depois |
| O4 | Sem métrica de uso (pedais importados, falhas de sincronização por fonte) | Baixa | Planejado junto com a sincronização automática (T-18) |
