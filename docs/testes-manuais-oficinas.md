# Checklist manual — Oficinas e agendamento (M2)

Roteiro para testar no app Expo (web, Expo Go ou simulador) contra a produção ou um ambiente local. Cada linha cita o requisito (`RFxx`/`RBxx`) e o resultado esperado. Marque `[x]` ao conferir e anote o que falhar como issue.

**Contas necessárias:** (A) administrador (e-mail de admin do Infisical), (B) atleta com pelo menos 1 bike, (C) segundo usuário que será o mecânico convidado. Pode ser a mesma pessoa em abas/contas diferentes.

## 1. Cadastro e aprovação da oficina (RF25, RB17)
- [ ] Aba **Oficinas > Sou uma oficina**: enviar pedido com nome e contato. Esperado: aparece "pedido em análise"; a oficina **não** aparece na lista dos atletas.
- [ ] Como admin, **Oficinas > Pedidos de oficina (admin)**: o pedido aparece com e-mail do dono e texto. Aprovar. Esperado: o pedido sai da fila.
- [ ] Um usuário que **não** é admin não vê o link de admin; chamar a rota de admin direto retorna 403 (RB17).
- [ ] Recusar um segundo pedido: o dono vê o pedido como recusado e não consegue operar a oficina.

## 2. Perfil, serviços e grade semanal (RF25, RF29)
- [ ] **Sou uma oficina** (dono aprovado): salvar endereço, site e coordenadas. Esperado: a oficina passa a ter distância na lista.
- [ ] Adicionar serviço escolhendo a **duração em horas** (de 0,5 h a 8 h) e, em "O que inclui", marcar categorias do catálogo (ex.: Transmissão, Suspensão), cada uma com a opção **zera desgaste** (marcada por padrão). Esperado: salvo; a lista mostra a duração e "· zera desgaste" ao lado de cada categoria (RF25, RF28).
- [ ] Horários de atendimento: a oficina sem grade própria atende **segunda a sábado, 8h às 19h**; não existe mais o botão "Adicionar horário" (RF25, RF26).
- [ ] Remover um serviço: some da lista dos atletas; agendamentos já feitos continuam.

## 3. Mecânico convidado (RB21)
- [ ] Dono convida o e-mail da conta C. Esperado: C passa a ver os atendimentos da oficina; C **não** consegue convidar ou remover ninguém.
- [ ] Dono remove C. Esperado: na requisição seguinte C perde o acesso (é checado a cada chamada).

## 4. Atleta encontra a oficina (RF26)
- [ ] **Oficinas** com permissão de localização: lista ordenada da mais perto para a mais longe, com distância.
- [ ] Negando a localização: aviso "Sem localização" e ordem alfabética.
- [ ] Cada cartão mostra serviços, "a partir de R$", **Site** e **Mapa** (abre o OpenStreetMap).
- [ ] Oficina pendente ou recusada **não** aparece.

## 5. Agendar (RF26, RF27, RB22)
- [ ] **Ver e agendar**: escolher o serviço, clicar em **Ver horários**, depois escolher bike e horário. Esperado: só horários de segunda a sábado entre 8h e 19h, e cada um mostra o início e o fim; nenhum horário termina depois das 19h.
- [ ] Agendar um serviço de 2 h às 10h e voltar a ver os horários de outro serviço: 10h, 10h30 e 11h não aparecem mais (sem sobreposição, RB22).
- [ ] Deixar a caixa "Autorizo a oficina a ver o histórico" **desmarcada** (é opcional) e confirmar. Esperado: agendamento aparece em **Meus agendamentos** como "histórico não compartilhado".
- [ ] Tentar agendar o mesmo horário em duas contas quase ao mesmo tempo. Esperado: a segunda recebe "horário acabou de ser ocupado" (RB22, 409) e a lista recarrega.
- [ ] Agendar com o interruptor **ligado** (segunda bike ou outro horário).

## 6. Privacidade do histórico (RF27, RNF03, RB09)
- [ ] Como dono/mecânico, abrir o atendimento **sem** compartilhamento: vê só a bike, o atleta e o serviço; **não** vê peças nem histórico; conclui só com itens livres (até 3).
- [ ] Abrir o atendimento **com** compartilhamento: vê peças instaladas e histórico da bike.
- [ ] Cancelar o agendamento com histórico compartilhado: a oficina perde o acesso a esse histórico.
- [ ] Outro mecânico de **outra** oficina não consegue abrir o atendimento (403/404).

## 7. Cancelar (RF29)
- [ ] Atleta cancela um agendamento. Esperado: some da lista de ativos, o horário volta a ficar livre, e a oficina recebe aviso no app e por e-mail (Resend) para o dono e os mecânicos.
- [ ] Cancelar em cima da hora (menos de 24 h) traz o aviso de cancelamento tardio.
- [ ] Sem `RESEND_API_KEY` o cancelamento ainda funciona (o e-mail apenas não sai).

## 8. Concluir a OS (RF28, RB23)
- [ ] Abrir um atendimento de um serviço que inclui a categoria Transmissão com "zera desgaste": os itens dessa categoria já vêm marcados como **Zerar contador**; categorias fora do serviço vêm em branco.- [ ] **Sou uma oficina > Abrir e concluir**: marcar um item do catálogo como "Zerar contador". Esperado: o desgaste da peça volta a zero e a meta avança para a próxima etapa (RB23).
- [ ] Marcar "Trocada" em uma peça: peça nova começa na primeira etapa.
- [ ] Concluir: o agendamento vira "Concluído" e a visita entra no histórico da bike do atleta.
- [ ] Concluir duas vezes o mesmo atendimento: a segunda é recusada.

## 9. Demonstração: revisão hipotética e exclusão (RF28)
Roteiro curto para a apresentação.
- [ ] Anotar o desgaste de uma peça de transmissão da bike (ex.: corrente em 60 %).
- [ ] Agendar o serviço com a categoria Transmissão (zera desgaste), abrir o atendimento como oficina e **concluir**. Esperado: o desgaste da corrente volta a 0 %, a visita aparece no histórico da bike e o agendamento fica "Concluído".
- [ ] No mesmo atendimento, clicar em **Excluir revisão**. Esperado: o agendamento volta a "Agendado", a visita some do histórico e o desgaste da corrente volta aos 60 % anotados (peças trocadas voltam à bike, a peça nova é apagada).
- [ ] Excluir uma revisão de outra oficina ou de um atendimento não concluído é recusado.

## 10. Fora do escopo e pendências conhecidas
- Etapas de revisão por peça (OPEN-48, issue #87): adiado por decisão do usuário.
- Google Agenda e WhatsApp Business para avisos: fases futuras.
- Não testado em dispositivo físico antes de 18/11; se algo quebrar no iOS/Android, registrar plataforma e versão do Expo Go.
