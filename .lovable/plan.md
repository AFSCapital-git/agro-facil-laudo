## Objetivo

Deixar o cliente HTTP da API Python (`http://187.127.24.128:8001`) pronto e bem configurado para ser usado em módulos novos/integrações específicas, **sem tocar no fluxo de autenticação atual** (Supabase / Lovable Cloud), que continua sustentando `Auth.tsx`, `useAuth`, roles, RLS e todo o resto do app.

## O que será feito

### 1. `src/lib/api-client.ts` (já existe — revisar e ajustar)
- Confirmar `baseURL` = `http://187.127.24.128:8001` via env (`VITE_API_URL`) com fallback hardcoded.
- Interceptor de request: injeta `Authorization: Bearer <token>` lendo de `localStorage.getItem('access_token')`.
- Interceptor de response: em `401`, limpa `access_token` + `user_id` do localStorage e redireciona para `/auth`.
- Garantir tipagem TS estrita (sem `any`).
- **Importante:** usar uma chave de localStorage separada (`api_access_token`) para não colidir com a sessão do Supabase, evitando que um 401 da API Python desconecte o usuário do Supabase.

### 2. `src/services/auth-service.ts` (já existe — revisar)
- Manter `register`, `login`, `getCurrentUser` (consome `GET /api/auth/me` já existente no servidor), `logout`, helpers `getToken`, `getUserId`, `isAuthenticated`.
- Ajustar para usar a mesma chave `api_access_token`.
- Tipos: `UserRegisterRequest`, `UserLoginRequest`, `TokenResponse`, `UserResponse` exportados.

### 3. NÃO alterar
- `src/pages/Auth.tsx` — continua usando Supabase.
- `src/hooks/useAuth.tsx` — continua usando Supabase.
- `src/hooks/useAuth-python.tsx` — fica disponível como hook opcional para módulos futuros que queiram a API Python, mas não é montado no `App.tsx`.
- Nenhuma página, rota ou ProtectedRoute.

### 4. Teste visual
- Como a mudança é só na camada de serviço (não há UI nova), o "teste visual" será:
  - Verificar que `/auth` continua carregando normal (login Supabase intacto).
  - Confirmar build sem erros de TS.

## O que NÃO será feito (e por quê)

- **Não vou migrar `Auth.tsx` para a API Python** — você escolheu "Coexistir". Migrar quebraria `useAuth`, `ProtectedRoute`, roles, RLS e ~todas as páginas que fazem queries Supabase.
- **Não vou criar o endpoint `GET /api/auth/me`** — esse endpoint vive no servidor Python (FastAPI em `187.127.24.128:8001`), fora do escopo do Lovable. Você confirmou que já está implementado lá.
- **Não vou redirecionar para `/dashboard` após login** — `Auth.tsx` não muda neste plano.

## Arquivos afetados

- `src/lib/api-client.ts` (ajuste pequeno: chave de token isolada + tipos)
- `src/services/auth-service.ts` (ajuste: mesma chave isolada)

## Próximo passo recomendado (fora deste plano)

Quando você tiver um módulo específico que deva usar a API Python (ex.: uma nova feature isolada), me diga qual e eu integro usando `apiClient` + `authService` já preparados.
