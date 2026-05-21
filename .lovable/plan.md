## Objetivo (FASE 0 — teste de fluxo)

Criar uma página isolada `/test-api` para validar end-to-end a integração com a API Python (`http://187.127.24.128:8001`) usando o `apiClient` e `authService` já preparados. Sem mexer em `Auth.tsx`, `useAuth`, rotas existentes, RLS ou Supabase.

## O que será construído

### 1. Nova página `src/pages/TestApi.tsx`
Painel de debug com três blocos empilhados:

- **Register**: form com email, senha, nome, role (select: produtor/engenheiro/agrobanker) → chama `authService.register()`.
- **Login**: form com email + senha → chama `authService.login()`.
- **Me**: botão "Validar /api/auth/me" → chama `authService.getCurrentUser()`. Mostra também token atual (mascarado) e user_id do `localStorage`.
- **Logout**: botão que chama `authService.logout()` e limpa o painel.

Cada bloco exibe:
- Status (idle / loading / success / error)
- Response JSON formatado num `<pre>`
- Mensagem de erro legível (status HTTP + corpo do erro)

Usa componentes shadcn já no projeto (`Card`, `Input`, `Button`, `Label`, `Select`, `Badge`) e tokens semânticos (sem cores hardcoded).

### 2. Rota pública `/test-api`
- Adicionar em `src/App.tsx` dentro do `<Routes>`.
- **Pública** (fora de `ProtectedRoute`) — o objetivo é justamente testar auth da API externa, sem depender da sessão Supabase.

### 3. Não alterar
- `Auth.tsx`, `useAuth.tsx`, `App.tsx` fora da linha de rota nova, sidebar, nenhuma outra página.
- Sem migrations, sem edge functions, sem mudanças no Supabase.

## Como o usuário vai testar

1. Acessar `/test-api` no preview.
2. Preencher email/senha/nome e clicar **Register** → ver token salvo no localStorage (`api_access_token`).
3. Clicar **Me** → confirmar que `/api/auth/me` retorna o usuário.
4. Logout → reentrar via **Login**.
5. Inspecionar o painel para ver requests, status HTTP e mensagens de erro vindas da API Python.

## Riscos / observações

- A API roda em HTTP (`http://187.127.24.128:8001`), não HTTPS. Browsers modernos podem bloquear mixed content se o preview Lovable estiver em HTTPS — vou exibir um aviso no topo da página explicando isso e como contornar (ex: abrir o preview em HTTP ou aceitar conteúdo misto).
- CORS: se a API Python não estiver liberando o domínio do preview Lovable, requests vão falhar com CORS error. O painel mostrará isso explicitamente.

## Arquivos afetados

- **Criar**: `src/pages/TestApi.tsx`
- **Editar**: `src/App.tsx` (adicionar 1 rota `<Route path="/test-api" element={<TestApi />} />`)
