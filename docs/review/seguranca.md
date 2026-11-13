# Revisão de segurança (OWASP, SSDLC e agentes de IA)

## 1. SSDLC no GearLog

| Fase | Prática |
|---|---|
| Requisitos | RNF01 (segredos criptografados), RNF02 (sem senhas), RB17 (admin por lista), minimização LGPD em `arquitetura.md` §5 |
| Design | ADR-002/005 (OIDC com PKCE), ADR-003 (Infisical), ADR-006 (cada atleta com o próprio app); ameaças abaixo |
| Implementação | Regras de CLAUDE.md para agentes; autorização em toda server action; segredos fora do Git |
| Verificação | Testes de OIDC, criptografia, SSRF e mapeamento de erro sem vazar chave; CI em todo PR |
| Implantação | Segredos entregues pelo Infisical via OIDC (nenhuma credencial do Infisical guardada); HTTPS forçado; domínio canônico |
| Operação | Logs só com códigos de erro; rotação de segredo = editar no Infisical e rodar o deploy |

## 2. OWASP Top 10 (2021)

| Categoria | Situação no GearLog |
|---|---|
| A01 Controle de acesso | `requireUser`/`requireAdmin` em toda action; consultas filtradas pelo dono (`ownBike`, `ownPart`); admin reconferido a cada requisição (RB17) |
| A02 Falhas criptográficas | AES-256-GCM para Client Secret, tokens e chave do conector; só o hash SHA-256 do token de sessão no banco; HTTPS forçado |
| A03 Injeção | Prisma com consultas parametrizadas; React escapa a saída; nenhum SQL montado à mão |
| A04 Design inseguro | Sem senhas; `state`, `nonce` e PKCE; e-mail verificado obrigatório |
| A05 Configuração | Cabeçalhos de segurança (ver S1); `.env` fora do Git |
| A06 Componentes vulneráveis | Dependências fixadas no `package-lock.json`; `npm audit` a acompanhar (S6) |
| A07 Autenticação | Delegada ao Google; cookie `httpOnly`, `Secure`, `SameSite=Lax`, 30 dias |
| A08 Integridade | Deploy só pelo GitHub Actions depois do CI; `npm ci` com lockfile |
| A09 Log e monitoramento | Ver [observabilidade.md](observabilidade.md) |
| A10 SSRF | URL do conector validada: só `https`, sem IP privado, loopback ou link-local |

## 3. Achados

| # | Achado | Severidade | Ação |
|---|---|---|---|
| S1 | Sem cabeçalhos de segurança (clickjacking, sniffing, HSTS) | Média | **Feito:** `next.config.ts` envia `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` e `Permissions-Policy` |
| S2 | Deploy publicava sem rodar testes | Média | **Feito:** testes, tipos e lint antes do `flyctl deploy` |
| S3 | Sem regras de permissão para agentes de IA no repositório | Média | **Feito:** `.claude/settings.json` com a matriz da seção 4 |
| S4 | Sem backup do banco: perda do volume apaga tudo | Alta | Planejado: T-21 (snapshot diário do volume do Fly) |
| S5 | Sem limite de taxa nas server actions e no callback de login | Baixa | Aceito na Fase 1 (login delegado ao Google; ações exigem sessão) |
| S6 | `npm audit` não roda no CI | Baixa | **Feito:** passo `npm audit --audit-level=high` informativo no CI |
| S7 | Sem Content-Security-Policy | Baixa | Planejado: CSP com nonce exige ajuste no Next; fica para depois do prazo |
| S8 | A chave de criptografia é única para todos os segredos e sem rotação | Baixa | Aceito; rotação documentada como futura (recriptografar ao trocar a chave) |

## 4. Camadas de segurança para agentes de IA

O projeto é escrito com ajuda de agentes (Claude Code). As camadas, da mais forte para a mais fraca:

1. **Sem acesso a segredos de produção:** os segredos ficam no Infisical; o agente não tem credencial dele nem do Fly.
2. **Permissões do repositório no GitHub:** a `main` só recebe PR.
3. **Matriz de permissões** em `.claude/settings.json` (abaixo).
4. **Constituição** ([CLAUDE.md](../../CLAUDE.md)): não inventar requisito, registrar lacunas como `OPEN-XX`, não expor tokens.
5. **Revisão humana:** o João aprova o que entra na `main`.

| Ação | Regra | Por quê |
|---|---|---|
| Ler código, docs, testes; rodar `npm test`, `npm run lint`, `npx tsc` | allow (padrão) | Sem efeito fora do repositório |
| Editar arquivos do repositório | allow (padrão) | Reversível pelo Git |
| `git push`, criar ou fazer merge de PR | ask | Publica e pode disparar deploy |
| `npm install` de pacote novo | ask | Cadeia de suprimentos (A06, A08) |
| Ler `.env`, `.env.*` (exceto `.env.example`) | deny | Segredos locais |
| `git push --force`, `git reset --hard` | deny | Perda de histórico |
| `flyctl`, `fly`, `infisical` | deny | Mexem direto em produção e segredos |
| `rm -rf` | deny | Destrutivo |
