# Paridade da Fase 1 — matriz de testes e checklist manual (web e app)

Gate para a troca de domínio para o Expo web (#67). A matriz liga cada requisito da Fase 1 ao teste automático que o cobre; o checklist cobre o que só se verifica na tela. Marque `[x]` ao conferir e abra uma issue para cada falha.

**Contas necessárias:** (A) administrador (e-mail de admin do Infisical) e (B) atleta com Strava conectado (limite de 10 atletas) ou pedais manuais.

## 1. Matriz requisito × teste automático

Resultado em 18/11/2026: 31 arquivos, 210 testes (`npx vitest run`), `tsc --noEmit` limpo na API e no app-expo.

| Requisito | Teste automático | Verificação manual (seção) |
|---|---|---|
| RF01, RF35 | `catalog.test.ts`, `bike-photo.test.ts`, `bike-detail-dto.test.ts` | 3 |
| RF02, RF03, RF39 | `catalog.test.ts`, `part-stock.test.ts` | 3 |
| RF04 | `google-admin-login.test.ts`, `password.test.ts`, `app-login.test.ts`, `app-password-login.test.ts` | 2 |
| RF05, RF06 | `rides-map.test.ts`, `activity-sources.test.ts`, `strava-webhook.test.ts` | 4 |
| RF07–RF09 | `wear.test.ts`, `dashboard-dto.test.ts` | 3 |
| RF10–RF12, RF36 | `wear.test.ts`, `visit.test.ts` | 3 |
| RF13, RF14 | `manual-ride.test.ts`, `rides-map.test.ts` | 4 |
| RF15 | `dashboard-dto.test.ts` | 3 |
| RF30, RF35, RF37 | `catalog.test.ts`, `admin-list.test.ts` | 5 |
| RF31 | `model-request.test.ts` | 5 |
| RF32, RF34 | `activity-sources.test.ts`, `crypto.test.ts` | 4 |
| RF38 | `email.test.ts` | 6 |

## 2. Entrar (RF04)
- [ ] Web, iOS e Android: **Entrar com Google** volta ao app já logado (deep link `gearlog://auth`).
- [ ] Criar conta com usuário e senha (mín. 8 caracteres) e entrar de novo com ela. Senha errada 5 vezes seguidas: "Muitas tentativas".
- [ ] Sair e abrir o app de novo: volta para a tela de login.

## 3. Bikes, peças e desgaste (RF01–RF03, RF07–RF12, RF15, RF35, RF39)
- [ ] Criar bike a partir de um modelo de fábrica com data retroativa: as peças originais aparecem com planos sugeridos.
- [ ] Painel: um cartão por bike; peças ordenadas por desgaste; barra amarela no mínimo da faixa e alerta de "troca próxima" (RF08) / "troca necessária" a 100 % (RF09).
- [ ] Trocar uma peça: a antiga vai ao histórico e a nova começa zerada (RF10). Remover peça: perguntar entre estoque e deletar (RF39).
- [ ] Registrar manutenção manual e uma visita à oficina com vários itens (RF12, RF36); aparecem no histórico em ordem cronológica (RF11).
- [ ] Excluir uma bike exige confirmação e mantém os pedais importados (RF01).

## 4. Pedais e fonte (RF05, RF06, RF13, RF14, RF32, RF34)
- [ ] Escolher a fonte: manual ou Strava (conectar com o botão e autorizar). Lançar um pedal manual com bike, data, km e horas; excluí-lo depois de confirmar.
- [ ] Sincronizar pelo botão: km e horas somam nas peças da bike associada (RF06).
- [ ] Com o Strava indisponível ou o token recusado: a falha é mostrada, os dados anteriores permanecem e dá para tentar de novo (RF13).

## 5. Admin e catálogo (RF30, RF31, RF35, RF37)
- [ ] Admin vê o painel; usuário comum recebe 403 na rota de admin (RB17).
- [ ] Incluir e remover e-mail de administrador (RF37).
- [ ] Pedir um modelo novo pelo menu de ajuda como atleta; o admin o vê e cadastra ou recusa (RF31).

## 6. Avisos (RF38)
- [ ] Aba **Avisos** lista os avisos, não lidos primeiro; "Marcar todos como lidos" funciona.
- [ ] Ativar e desativar o aviso por e-mail nas configurações (envio real depende do Resend, adiado).

## 7. Lacunas conhecidas
- Telas Expo do Admin e do catálogo (#65) ainda não têm paridade com `/admin`.
- Login/vínculo do Strava no app depende do app Strava central (#62).
- Sem teste automatizado de interface no CI; o roteiro acima é manual.
