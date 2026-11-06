# Personas — GearLog

O sistema tem quatro perfis de acesso: **Atleta**, **Lojista**, **Mecânico/Oficina** e **Administrador**. Cada persona abaixo representa um perfil.

---

## 1. Rafael — Atleta (perfil principal)

- **Idade:** 27 anos · **Ocupação:** estudante de engenharia e triatleta amador
- **Bikes:** uma speed de alumínio para treinos de estrada e uma mountain bike full suspension para trilha
- **Uso:** treina de 5 a 6 vezes por semana e registra tudo no Strava
- **Dor:** troca a corrente "quando lembra". Já perdeu um cassete por isso. Não sabe quantos km tem o pneu traseiro.
- **Objetivo:** receber um aviso antes de cada peça chegar ao limite e manter um histórico de cada bike
- **Como o GearLog ajuda:** km automática via Strava, alerta por peça, histórico, e (Fase 2) uma aba de "sonhos" para comprar a próxima peça pelo preço que quer pagar
- **Fases:** 1, 2 e 3

## 2. Marcos — Lojista

- **Idade:** 41 anos · **Ocupação:** dono de uma loja de bike de bairro
- **Dor:** tem estoque parado e não sabe quem está procurando aquela peça
- **Objetivo:** anunciar peças para ciclistas que realmente precisam delas e ganhar credibilidade online
- **Como o GearLog ajuda:** vitrine própria, selo de lojista verificado e avisos de "sonhos" compatíveis com seus anúncios
- **Fase:** 2

## 3. Cláudia — Mecânica/Oficina

- **Idade:** 35 anos · **Ocupação:** mecânica e dona de uma oficina especializada em suspensão
- **Dor:** o cliente chega sem saber quantos km a bike tem nem quando foi a última revisão
- **Objetivo:** receber agendamentos já com o histórico do equipamento e registrar o serviço feito
- **Como o GearLog ajuda:** agenda de revisões e acesso ao histórico da bike autorizado pelo atleta
- **Fase:** 3

## 4. Beatriz — Administradora

- **Idade:** 30 anos · **Ocupação:** responsável pela operação da plataforma
- **Dor:** precisa garantir que lojistas sejam reais e que anúncios não sejam golpe
- **Objetivo:** cadastrar e verificar lojistas, moderar anúncios e manter o catálogo de peças
- **Como o GearLog ajuda:** painel de verificação de lojistas, concessão de selo e moderação
- **Fases:** 2 e 3

---

## Matriz persona × funcionalidade

| Funcionalidade | Atleta | Lojista | Mecânico | Admin |
|---|:-:|:-:|:-:|:-:|
| Cadastrar bike e peças | ✔ | | | |
| Sincronizar Strava | ✔ | | | |
| Alertas de desgaste | ✔ | | | |
| Anunciar peça | ✔ | ✔ | | |
| Aba de "sonhos" | ✔ | (recebe aviso) | | |
| Verificar lojista | | | | ✔ |
| Agendar revisão | ✔ | | ✔ | |
| Registrar serviço | | | ✔ | |
