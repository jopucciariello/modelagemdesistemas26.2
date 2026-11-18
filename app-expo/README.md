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
- `GET /me` com `Authorization: Bearer <token>`: `{ id, name, email, role }`. `401` derruba a sessão.

Segredos nunca entram neste app: só `EXPO_PUBLIC_*` não sensíveis.
