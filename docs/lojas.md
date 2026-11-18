# Metadados das lojas — App Store e Google Play (#76)

Textos e respostas prontos para colar nos formulários da Apple e do Google. Tudo em português (pt-BR). Itens marcados **[VOCÊ]** dependem de uma conta ou de uma ação sua e não podem ser feitos por aqui.

## 1. Identidade

| Campo | Valor |
|---|---|
| Nome | GearLog |
| Subtítulo (Apple, 30 caracteres) | Desgaste e oficina da bike |
| Descrição curta (Google, 80 caracteres) | Controle o desgaste das peças da sua bike e agende a revisão. |
| Categoria | Esportes e fitness (Apple) · Saúde e fitness (Google) |
| Palavras-chave (Apple, 100 caracteres) | bike,bicicleta,ciclismo,strava,manutenção,oficina,peças,corrente,pneu,revisão |
| Idioma | Português (Brasil) |
| URL de privacidade | https://gearlog.jopucci.com/privacidade |
| URL dos termos | https://gearlog.jopucci.com/termos |
| URL de suporte | https://gearlog.jopucci.com |
| Identificadores | `slug: gearlog`, esquema `gearlog` (`app-expo/app.json`). **[VOCÊ]** definir o bundle id (iOS) e o package (Android) ao criar os apps. |

## 2. Descrição longa

> O GearLog mostra quanto cada peça da sua bike já desgastou e avisa antes de ela falhar.
>
> • **Bikes e peças:** cadastre suas bikes (ou comece por um modelo de fábrica) e as peças instaladas, com planos de manutenção do catálogo.
> • **Desgaste calculado:** a quilometragem e as horas dos seus pedais, importados do Strava ou lançados à mão, somam em cada peça. A barra fica amarela antes da hora de trocar.
> • **Histórico:** troca de peça, lubrificação, revisão na oficina, tudo em ordem cronológica.
> • **Oficinas:** veja as oficinas mais próximas, escolha um horário livre e, se quiser, compartilhe o histórico da bike com o mecânico.
> • **Mercado de peças:** anuncie e encontre peças usadas e novas, e seja avisado quando aparecer a peça dos seus sonhos pelo preço que você quer.
>
> Compatible with Strava. O GearLog não é afiliado nem endossado pelo Strava. As estimativas de desgaste são recomendações e não substituem a avaliação de um mecânico.

## 3. Ícone, splash e capturas

- **Logo escolhida:** opção A, coroa (aplicada no PR #107). Fontes em `logo/opcao-A-coroa/` nos arquivos do projeto (`icone-app-light/dark`, `lockup-light/dark`, PNG e SVG).
- **No app:** `app-expo/assets/images/icon.png`, `splash-icon.png` e os três ícones adaptativos do Android já usam a coroa.
- **Ícone das lojas:** Apple pede 1024×1024 PNG sem transparência e sem cantos arredondados; Google pede 512×512. `app-expo/assets/images/icon.png` já tem 1024×1024; **[VOCÊ]** conferir que não tem transparência antes de enviar e gerar a versão 512×512 para o Google.
- **Capturas:** as telas de referência estão em `screenshots/expo-redesign/`, `screenshots/mercado/` e `screenshots/oficinas-portfolio/` (arquivos do projeto), em claro e escuro. Apple exige capturas de iPhone 6,9" (1320×2868) e, se o app rodar em iPad, de iPad; Google exige 2 a 8 capturas de celular. **[VOCÊ]** tirar as capturas finais num simulador ou aparelho depois do build (#75). Telas sugeridas, nesta ordem: Painel, Bike com desgaste, Pedais, Oficinas, Mercado.

## 4. Revisores: conta de teste

A revisão precisa entrar no app. O login é por Google ou por usuário e senha.
- **[VOCÊ]** criar um usuário de teste (por exemplo `revisor`) com uma bike, algumas peças e alguns pedais lançados à mão, e colar o usuário e a senha **só** nos formulários das lojas. Não registrar a senha em arquivo do repositório.
- Para mostrar as telas de administração ou de oficina, o revisor não precisa de acesso: descrever em "notas para o revisor" que são restritas a administradores e oficinas aprovadas.

## 5. Declaração de dados

Para o "App Privacy" da Apple e a "Segurança dos dados" do Google. Base: [política de privacidade](https://gearlog.jopucci.com/privacidade).

| Dado | Coletado | Ligado ao usuário | Finalidade | Compartilhado |
|---|---|---|---|---|
| Nome e e-mail | Sim | Sim | Conta e login | Não |
| Usuário e senha | Sim (hash) | Sim | Login | Não |
| Fotos (bike e anúncios) | Sim, enviadas pelo usuário | Sim | Funcionalidade do app | Anúncios ficam visíveis a outros usuários |
| Atividades de ciclismo (distância, tempo, data) | Sim, do Strava ou lançadas à mão | Sim | Cálculo do desgaste | Não |
| Localização aproximada | Lida no aparelho, não enviada nem guardada | Não | Ordenar oficinas por distância | Não |
| Telefone (WhatsApp do vendedor) | Sim, opcional | Sim | Contato em anúncios | Visível no botão de contato do anúncio |
| Token de push (quando houver, #77) | Sim | Sim | Avisos | Apple/Google (entrega) |

- Sem publicidade, sem rastreamento entre apps e sem SDKs de análise de terceiros: marcar "não rastreia".
- Dados criptografados em trânsito (HTTPS). Exclusão de conta: dentro do app, em Configurações > Excluir minha conta (RF40, PR de exclusão), e por pedido ao administrador (ver privacidade).
- Sobre o Strava: dados lidos só para o próprio atleta, nunca exibidos a terceiros, nem usados em IA.

## 6. Classificação etária

Sem violência, conteúdo adulto, jogos de azar ou compras no app. Há conteúdo gerado por usuários (anúncios e fotos) com denúncia e remoção pelo administrador. Sugestão: 4+ (Apple) / Livre ou equivalente com a observação de conteúdo de usuário (Google). O app não é dirigido a menores de 13 anos.

## 7. Pendências levantadas

1. Capturas finais e o ícone 512×512 do Google (ver seção 3).
2. Contas de desenvolvedor Apple e Google, bundle id e package (#75).
