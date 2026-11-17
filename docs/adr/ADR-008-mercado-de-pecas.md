# ADR-008 — Mercado de peças (Fase 2): modelo e decisões simples

- **Status:** Proposto (aguarda aprovação do João; OPEN-30 a OPEN-35)
- **Data:** 16/11/2026
- **Decisor:** João Pucciariello
- **Requisitos relacionados:** RF16 a RF24, RB06, RB07, RB19, RB20, RNF03

## Contexto

Em 16/11/2026 João decidiu tentar implementar a Fase 2 antes da entrega, sem colocar a Fase 1 (em produção) em risco. O prazo pede o caminho mais simples, e [segundo-estagio.md](../segundo-estagio.md) deixa várias decisões em aberto.

## Decisão

1. **Mesmo app e mesmo banco.** A Fase 2 é um conjunto de tabelas novas (`Merchant`, `Listing`, `Dream`, `Notification`) numa migração aditiva. Nenhuma tabela da Fase 1 muda; nada da Fase 1 depende da Fase 2.
2. **Lojista não é um papel novo.** É um usuário com um `Merchant` criado pelo admin (OPEN-30). O selo (`verified`) só muda pelo admin (RB06). `Role` continua `ATHLETE` ou `ADMIN`.
3. **Fotos por URL**, até 3, sem upload (OPEN-31): evita storage de arquivos e limites de volume.
4. **Compatibilidade sonho × anúncio:** mesma família do catálogo e palavras-chave no título (OPEN-32). Reaproveita o catálogo (RB15).
5. **Notificações só dentro do app** (OPEN-34), tabela `Notification` com `refKey` único por usuário para não duplicar.
6. **Km de uso é digitada pelo vendedor** (RB07): nenhum dado do Strava vai a terceiros, o que contorna a OPEN-02.
7. **Sem pagamento.** O anúncio mostra o e-mail do vendedor a usuários logados (RB20, OPEN-35).
8. **Preço em centavos inteiros** (BRL), para não ter erro de ponto flutuante nas comparações do RF21.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Novo papel `MERCHANT` em `Role` | Mexe no login e nos guards da Fase 1; um perfil de loja ligado ao usuário basta. |
| Upload de fotos | Exige storage e limites; URL cumpre o RF16 na demo. |
| E-mail ou push nos avisos | Depende de provedor e segredos novos (RNF01); fica para depois. |
| Casamento por modelo exato do catálogo | Anúncios muitas vezes não têm componente do catálogo; família e palavras-chave são mais úteis. |

## Consequências

- A Fase 2 pode ser revertida desligando as rotas, sem migração de volta.
- A lista de e-mail do vendedor exige login (RNF03 analogamente: dado pessoal só a quem está autenticado).
- Compatibilidade por palavras-chave pode dar falsos positivos; o atleta apaga o sonho se incomodar.
