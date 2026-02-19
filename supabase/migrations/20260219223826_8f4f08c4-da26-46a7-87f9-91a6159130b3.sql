-- Fix infinite recursion in laudos RLS policy
-- The laudos_select policy references solicitacoes_laudo, which has a policy referencing laudos
-- Use security definer functions to break the cycle

CREATE OR REPLACE FUNCTION public.get_produtor_solicitacao_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.solicitacoes_laudo
  WHERE produtor_id = (SELECT id FROM public.produtores WHERE user_id = auth.uid() LIMIT 1)
$$;

CREATE OR REPLACE FUNCTION public.get_engenheiro_laudo_solicitacao_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT solicitacao_id FROM public.laudos
  WHERE engenheiro_id = (SELECT id FROM public.engenheiros WHERE user_id = auth.uid() LIMIT 1)
$$;

-- Drop and recreate laudos_select without referencing solicitacoes_laudo directly
DROP POLICY IF EXISTS "laudos_select" ON public.laudos;
CREATE POLICY "laudos_select"
  ON public.laudos
  FOR SELECT
  TO authenticated
  USING (
    engenheiro_id = get_engenheiro_id()
    OR is_admin()
    OR (is_produtor() AND solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
  );

-- Drop and recreate solicitacoes_select without referencing laudos directly
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_select"
  ON public.solicitacoes_laudo
  FOR SELECT
  TO authenticated
  USING (
    produtor_id = get_produtor_id()
    OR is_admin()
    OR (is_engenheiro() AND (
      status_solicitacao = 'aberta'
      OR id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
    ))
  );