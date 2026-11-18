# GearLog — app Expo (web, iOS e Android)

Interface universal do GearLog ([ADR-010](../docs/adr/ADR-010-expo-universal.md)). Estrutura:

- `src/app/(auth)/` — login (rotas só para quem não entrou).
- `src/app/(app)/` — abas Painel, Oficinas (M2), Mercado (M3) e Configurações; só para quem entrou. Novas telas entram aqui.
- `src/auth/auth-context.tsx` — sessão por token (`useAuth`).
- `src/lib/api.ts` — cliente da API com `Authorization: Bearer` (`api<T>(path)`).
- `src/lib/storage.ts` — token em SecureStore (celular) ou localStorage (web).

## Rodar

```bash
cd app-expo
npm install
EXPO_PUBLIC_API_URL=https://gearlog.jopucci.com npx expo start   # w = web, i = iOS, a = Android
```

## Contrato com a API (issue #61)

- `GET /auth/google/app?redirect=<deep link>`: faz o login Google e volta para `<redirect>?token=<token>`.
- `GET /api/me` com `Authorization: Bearer <token>`: `{ id, name, email, role }`. `401` derruba a sessão.

Segredos nunca entram neste app: só `EXPO_PUBLIC_*` não sensíveis.

## Onde a API roda hoje

Enquanto as telas do Expo não cobrem a Fase 1 inteira (issue #68), a API fica no servidor atual, em `src/app/api/*` e `src/app/auth/google/*`, reaproveitando `src/lib` e a tabela `Session` (o token é guardado só como hash). Depois da troca de domínio, as páginas do Next saem e ficam só as rotas de API.
