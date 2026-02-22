
-- 1. Add assisted mode columns to solicitacoes_laudo
ALTER TABLE public.solicitacoes_laudo 
ADD COLUMN assistido boolean NOT NULL DEFAULT false,
ADD COLUMN engenheiro_assistente_id uuid REFERENCES public.engenheiros(id);

-- 2. Allow produtores to see approved engineers (for assisted mode selection)
DROP POLICY IF EXISTS "engenheiros_select" ON public.engenheiros;
CREATE POLICY "engenheiros_select" ON public.engenheiros
FOR SELECT USING (
  (user_id = auth.uid()) OR is_admin() OR is_mesa_produtos() OR 
  (is_produtor() AND status_verificacao = 'aprovado')
);

-- 3. Update solicitacoes_laudo SELECT to include assistant engineer
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_laudo
FOR SELECT USING (
  (produtor_id = get_produtor_id()) OR is_admin() OR is_mesa_produtos() OR 
  (is_banco() AND (banco_parceiro_id = get_banco_parceiro_id())) OR 
  (is_engenheiro() AND (
    (status_solicitacao = ANY (ARRAY['aguardando_laudo'::text, 'pronta_para_banco'::text])) OR 
    (id IN (SELECT get_engenheiro_laudo_solicitacao_ids())) OR 
    (engenheiro_atribuido_id = get_engenheiro_id()) OR
    (assistido = true AND engenheiro_assistente_id = get_engenheiro_id())
  ))
);

-- 4. Update solicitacoes_laudo UPDATE to include assistant engineer
DROP POLICY IF EXISTS "solicitacoes_update" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_update" ON public.solicitacoes_laudo
FOR UPDATE USING (
  (produtor_id = get_produtor_id()) OR is_admin() OR is_mesa_produtos() OR 
  (is_engenheiro() AND (
    (id IN (SELECT get_engenheiro_laudo_solicitacao_ids())) OR 
    (engenheiro_atribuido_id = get_engenheiro_id()) OR
    (assistido = true AND engenheiro_assistente_id = get_engenheiro_id())
  ))
);

-- 5. Allow assistant engineer to insert docs
CREATE POLICY "engenheiro_assistente_insert_docs" ON public.solicitacao_documentos
FOR INSERT WITH CHECK (
  is_engenheiro() AND EXISTS (
    SELECT 1 FROM solicitacoes_laudo sl
    WHERE sl.id = solicitacao_id
    AND sl.assistido = true
    AND sl.engenheiro_assistente_id = get_engenheiro_id()
    AND sl.docs_habilitados = true
  )
);

-- 6. Allow assistant engineer to see docs
CREATE POLICY "engenheiro_assistente_select_docs" ON public.solicitacao_documentos
FOR SELECT USING (
  is_engenheiro() AND EXISTS (
    SELECT 1 FROM solicitacoes_laudo sl
    WHERE sl.id = solicitacao_id
    AND sl.assistido = true
    AND sl.engenheiro_assistente_id = get_engenheiro_id()
  )
);

-- 7. Allow assistant engineer to delete docs they manage
CREATE POLICY "engenheiro_assistente_delete_docs" ON public.solicitacao_documentos
FOR DELETE USING (
  is_engenheiro() AND EXISTS (
    SELECT 1 FROM solicitacoes_laudo sl
    WHERE sl.id = solicitacao_id
    AND sl.assistido = true
    AND sl.engenheiro_assistente_id = get_engenheiro_id()
  )
);

-- 8. Update chat INSERT to include assistant engineer
DROP POLICY IF EXISTS "chat_insert" ON public.chat_mensagens;
CREATE POLICY "chat_insert" ON public.chat_mensagens
FOR INSERT WITH CHECK (
  (remetente_id = auth.uid()) AND (
    is_mesa_produtos() OR is_admin() OR 
    (is_banco() AND (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()))) OR
    (is_engenheiro() AND (
      (solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())) OR 
      (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())) OR
      (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id()))
    )) OR
    (is_produtor() AND (solicitacao_id IN (SELECT get_produtor_solicitacao_ids())))
  )
);

-- 9. Update chat SELECT to include assistant engineer
DROP POLICY IF EXISTS "chat_select" ON public.chat_mensagens;
CREATE POLICY "chat_select" ON public.chat_mensagens
FOR SELECT USING (
  is_admin() OR is_mesa_produtos() OR 
  (is_banco() AND (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()))) OR
  (is_engenheiro() AND (
    (solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())) OR 
    (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())) OR
    (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id()))
  )) OR
  (is_produtor() AND (solicitacao_id IN (SELECT get_produtor_solicitacao_ids())))
);

-- 10. Update eventos SELECT to include assistant engineer
DROP POLICY IF EXISTS "eventos_select" ON public.solicitacao_eventos;
CREATE POLICY "eventos_select" ON public.solicitacao_eventos
FOR SELECT USING (
  is_admin() OR is_mesa_produtos() OR 
  (is_banco() AND (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()))) OR
  (solicitacao_id IN (SELECT get_produtor_solicitacao_ids())) OR
  (is_engenheiro() AND (
    (solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())) OR 
    (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())) OR
    (solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id()))
  ))
);
