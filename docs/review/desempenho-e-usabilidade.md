# Revisão de desempenho e usabilidade

Requisitos: RNF04 (páginas em até 2 s no 4G) e RNF07 (celular).

## Medições

Ainda não houve teste de carga. Nos testes ponta a ponta locais (`next start`, banco descartável com poucos pedais), as páginas responderam sem espera perceptível. Em produção, a máquina do Fly para quando ociosa (`auto_stop_machines`), então o primeiro acesso depois de um tempo parado espera a máquina subir. Medir o RNF04 com Lighthouse em perfil 4G é a próxima ação (D5).

## Achados

| # | Achado | Severidade | Ação |
|---|---|---|---|
| D1 | Partida a frio da máquina do Fly pode passar de 2 s no primeiro acesso (RNF04) | Baixa | Aceito na Fase 1 (custo zero); `min_machines_running = 1` resolve se necessário |
| D2 | O painel lê todos os pedais do atleta a cada acesso (ADR-007). Cresce linearmente com o histórico | Baixa | Aceito na Fase 1 (um atleta tem centenas a poucos milhares de pedais); se crescer, índice por atleta e data ou cache por plano |
| D3 | No celular (390 px), a tabela do painel corta a coluna de desgaste (RNF07) | Média | Planejado: T-22 (cartões no celular) |
| D4 | O seletor de bike-modelo estoura a largura no celular | Baixa | Planejado: T-22 |
| D5 | RNF04 sem medição formal | Média | Planejado: rodar Lighthouse (4G) no painel e na página da bike e anotar aqui |
