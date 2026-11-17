# ADR-008 — Mercado de peças (Fase 2)

- **Status:** Aceito (17/11/2026, respostas de João a OPEN-30 a OPEN-35)
- **Data:** 16/11/2026; reescrito em 17/11/2026
- **Decisor:** João Pucciariello
- **Requisitos relacionados:** RF16 a RF24, RF38, RB06, RB07, RB19, RB20, RNF03

## Contexto

Em 16/11/2026 João decidiu tentar a Fase 2 sem pôr a Fase 1 em risco. Em 17/11/2026 respondeu às decisões em aberto; este ADR registra o resultado.

## Decisão

1. **Mesmo app e mesmo banco**, com tabelas aditivas (`Merchant`, `Listing`, `Dream`, `Notification`). Nada da Fase 1 depende da Fase 2.
2. **Lojista por pedido (OPEN-30).** O usuário preenche um formulário com texto livre (pedido e contato); o administrador confere que é uma loja de verdade e aprova em `/admin`. Lojista não é um papel de login. O anúncio de lojista tem um botão que leva o comprador direto à loja (link ou contato).
3. **Fotos por upload, até 3 por anúncio (OPEN-31)**, reaproveitando o mecanismo da foto da bike (arquivo no volume, validação de tipo e tamanho).
4. **Sonho × anúncio por modelo do catálogo (OPEN-32).** Ambos escolhem um modelo do catálogo; o alerta sai quando o modelo coincide e o preço é ≤ máximo.
5. **Alertas a lojistas são serviço pago (OPEN-33).** O lojista marca no perfil as famílias que vende; só recebe o alerta de novo sonho quem o administrador liberou com a "informação privilegiada" (`Merchant.premiumAlerts`).
6. **Notificações no app e por e-mail, com opt-in (OPEN-34, RF38).** Push só quando houver app nativo iOS/Android. O envio de e-mail exige um provedor e um segredo novo (RNF01): `SMTP_URL`/`MAIL_FROM` no Infisical; sem eles, só o aviso no app.
7. **Contato por WhatsApp (OPEN-35).** O vendedor informa o número; o anúncio tem o botão, visível só a usuários logados (RB20).
8. **Km de uso digitada pelo vendedor** (RB07): nenhum dado do Strava vai a terceiros (OPEN-02).
9. **Sem pagamento.** Preço em centavos inteiros (BRL).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Admin cadastrar lojistas à mão | O pedido com texto e contato dá ao administrador o que conferir (decisão de João). |
| Fotos por URL | João pediu upload. |
| Casamento por família e palavras-chave | João pediu o modelo do catálogo, que dá menos falso positivo. |
| Alerta a todo lojista da família | É serviço pago, só para quem o administrador libera. |
| Contato por e-mail do vendedor | WhatsApp é o canal que João escolheu. |

## Consequências

- Migração aditiva: pedido de lojista (texto, contato), famílias do lojista, `premiumAlerts`, fotos do anúncio, WhatsApp, modelo do catálogo em anúncio e sonho, preferência de e-mail.
- Fotos no volume aumentam o espaço usado do SQLite/volume; limite de 3 fotos e de tamanho por foto.
- O botão de WhatsApp expõe um número pessoal: só a usuários logados.
