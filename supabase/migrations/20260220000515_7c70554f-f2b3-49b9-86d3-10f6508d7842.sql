
-- 2. Create helper function for mesa role check
CREATE OR REPLACE FUNCTION public.is_mesa_produtos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'mesa_produtos')
$$;

-- 3. Add new columns to solicitacoes_laudo for mesa workflow
ALTER TABLE public.solicitacoes_laudo
  ADD COLUMN IF NOT EXISTS status_mesa text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS engenheiro_atribuido_id uuid REFERENCES public.engenheiros(id),
  ADD COLUMN IF NOT EXISTS notas_mesa text DEFAULT '',
  ADD COLUMN IF NOT EXISTS aprovado_mesa_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovado_mesa_por uuid;

-- 4. Create chat table for engenheiro <-> mesa communication
CREATE TABLE IF NOT EXISTS public.chat_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid REFERENCES public.solicitacoes_laudo(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL,
  remetente_role text NOT NULL,
  mensagem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_select" ON public.chat_mensagens FOR SELECT USING (
  is_admin() OR is_mesa_produtos()
  OR (is_engenheiro() AND solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids()))
  OR (is_produtor() AND solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
  OR (is_engenheiro() AND solicitacao_id IN (
    SELECT id FROM public.solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id()
  ))
);

CREATE POLICY "chat_insert" ON public.chat_mensagens FOR INSERT WITH CHECK (
  remetente_id = auth.uid() AND (
    is_mesa_produtos() OR is_admin()
    OR (is_engenheiro() AND (
      solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
      OR solicitacao_id IN (SELECT id FROM public.solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())
    ))
    OR (is_produtor() AND solicitacao_id IN (SELECT get_produtor_solicitacao_ids()))
  )
);

-- 5. Update solicitacoes_laudo RLS to allow mesa_produtos access
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_laudo FOR SELECT USING (
  (produtor_id = get_produtor_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_engenheiro() AND (
    (status_solicitacao = 'aberta' AND status_mesa = 'aprovada')
    OR (id IN (SELECT get_engenheiro_laudo_solicitacao_ids()))
    OR (engenheiro_atribuido_id = get_engenheiro_id())
  ))
);

DROP POLICY IF EXISTS "solicitacoes_update" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_update" ON public.solicitacoes_laudo FOR UPDATE USING (
  (produtor_id = get_produtor_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_engenheiro() AND (
    id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
    OR engenheiro_atribuido_id = get_engenheiro_id()
  ))
);

-- 6. Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_mensagens;
