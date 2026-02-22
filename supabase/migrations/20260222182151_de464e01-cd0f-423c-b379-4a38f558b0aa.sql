
-- 1. Add is_banco helper function (now that 'banco' enum value is committed)
CREATE OR REPLACE FUNCTION public.is_banco()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'banco')
$$;

-- 2. Update solicitacoes_laudo SELECT policy to include banco role
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_laudo FOR SELECT
USING (
  (produtor_id = get_produtor_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_banco() AND banco_parceiro_id = get_banco_parceiro_id())
  OR (is_engenheiro() AND (
    (status_solicitacao = ANY (ARRAY['aguardando_laudo','pronta_para_banco']))
    OR (id IN (SELECT get_engenheiro_laudo_solicitacao_ids()))
    OR (engenheiro_atribuido_id = get_engenheiro_id())
  ))
);

-- 3. Update chat_mensagens SELECT policy
DROP POLICY IF EXISTS "chat_select" ON public.chat_mensagens;
CREATE POLICY "chat_select" ON public.chat_mensagens FOR SELECT
USING (
  is_admin()
  OR is_mesa_produtos()
  OR (is_banco() AND solicitacao_id IN (
    SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()
  ))
  OR (is_engenheiro() AND (
    solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
    OR solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())
  ))
  OR (is_produtor() AND solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
);

-- 4. Update chat_mensagens INSERT policy
DROP POLICY IF EXISTS "chat_insert" ON public.chat_mensagens;
CREATE POLICY "chat_insert" ON public.chat_mensagens FOR INSERT
WITH CHECK (
  remetente_id = auth.uid()
  AND (
    is_mesa_produtos()
    OR is_admin()
    OR (is_banco() AND solicitacao_id IN (
      SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()
    ))
    OR (is_engenheiro() AND (
      solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
      OR solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())
    ))
    OR (is_produtor() AND solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
  )
);

-- 5. Update laudos SELECT policy
DROP POLICY IF EXISTS "laudos_select" ON public.laudos;
CREATE POLICY "laudos_select" ON public.laudos FOR SELECT
USING (
  (engenheiro_id = get_engenheiro_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_banco() AND solicitacao_id IN (
    SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()
  ))
  OR (is_produtor() AND solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
);

-- 6. Update solicitacao_eventos SELECT policy
DROP POLICY IF EXISTS "eventos_select" ON public.solicitacao_eventos;
CREATE POLICY "eventos_select" ON public.solicitacao_eventos FOR SELECT
USING (
  is_admin()
  OR is_mesa_produtos()
  OR (is_banco() AND solicitacao_id IN (
    SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()
  ))
  OR (solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
  OR (is_engenheiro() AND (
    solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
    OR solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())
  ))
);
