# Personas — GearLog

Na entrega da disciplina, o sistema tem dois perfis de acesso: **Atleta** e **Administrador**. Cada persona abaixo representa um perfil. Os perfis **Lojista** e **Mecânico/Oficina** pertencem ao [segundo estágio](segundo-estagio.md).

---

## 1. Rafael — Atleta (perfil principal)

- **Idade:** 27 anos · **Ocupação:** estudante de engenharia e triatleta amador
- **Bikes:** uma speed de alumínio para treinos de estrada e uma mountain bike full suspension para trilha
- **Uso:** treina de 5 a 6 vezes por semana e registra tudo no Strava
- **Dor:** troca a corrente "quando lembra". Já perdeu um cassete por isso. Não sabe quantos km tem o pneu traseiro.
- **Objetivo:** receber um aviso antes de cada peça chegar ao limite e manter um histórico de cada bike
- **Como o GearLog ajuda:** km e horas de uso automáticos (API do Strava ou conector) ou lançados à mão, alerta por peça, histórico, e (Fase 2) uma aba de "sonhos" para comprar a próxima peça pelo preço que quer pagar
- **Fases:** 1 (e 2–3 no segundo estágio)

## 2. Beatriz — Administradora

- **Idade:** 30 anos · **Ocupação:** responsável pela operação da plataforma
- **Dor:** atletas cadastram a mesma peça com nomes diferentes e sem vida útil de referência, e o catálogo fica desatualizado a cada lançamento
- **Objetivo:** manter o catálogo de peças: categorias, vida útil padrão e lançamentos de componentes (RF30). No segundo estágio, também verifica lojistas e modera anúncios.
- **Como o GearLog ajuda:** cadastro central de categorias e componentes, usado pelos atletas no cadastro de peças, e uma fila de sugestões de componentes novos enviadas pelos atletas (RF31). Entra em `/admin` com sua conta Google autorizada (RB17)
- **Fases:** 1, 2 e 3

---

## Matriz persona × funcionalidade (entrega)

| Funcionalidade | Atleta | Admin |
|---|:-:|:-:|
| Cadastrar bike e peças | ✔ | |
| Escolher a fonte dos pedais (manual, API do Strava ou conector) | ✔ | |
| Alertas de desgaste | ✔ | |
| Registrar troca, revisão e manutenção | ✔ | |
| Manter catálogo de peças (categorias e componentes) | | ✔ |
| Sugerir componente novo / aprovar sugestão | ✔ | ✔ |
