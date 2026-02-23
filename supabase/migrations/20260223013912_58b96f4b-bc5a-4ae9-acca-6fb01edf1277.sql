
-- 1. Banco pode ver propriedades das solicitações vinculadas
CREATE POLICY "banco_select_propriedades"
ON public.propriedades
FOR SELECT
USING (
  is_banco() AND id IN (
    SELECT propriedade_id FROM solicitacoes_laudo
    WHERE banco_parceiro_id = get_banco_parceiro_id()
      AND status_banco <> 'nao_enviado'
  )
);

-- 2. Banco pode ver produtores das solicitações vinculadas
CREATE POLICY "banco_select_produtores"
ON public.produtores
FOR SELECT
USING (
  is_banco() AND id IN (
    SELECT produtor_id FROM solicitacoes_laudo
    WHERE banco_parceiro_id = get_banco_parceiro_id()
      AND status_banco <> 'nao_enviado'
  )
);

-- 3. Banco pode ver engenheiros das solicitações vinculadas
CREATE POLICY "banco_select_engenheiros"
ON public.engenheiros
FOR SELECT
USING (
  is_banco() AND id IN (
    SELECT engenheiro_atribuido_id FROM solicitacoes_laudo
    WHERE banco_parceiro_id = get_banco_parceiro_id()
      AND status_banco <> 'nao_enviado'
      AND engenheiro_atribuido_id IS NOT NULL
  )
);

-- 4. Banco pode ver assinaturas dos laudos vinculados
CREATE POLICY "banco_select_assinatura_laudo"
ON public.assinatura_laudo
FOR SELECT
USING (
  is_banco() AND laudo_id IN (
    SELECT l.id FROM laudos l
    JOIN solicitacoes_laudo s ON l.solicitacao_id = s.id
    WHERE s.banco_parceiro_id = get_banco_parceiro_id()
      AND s.status_banco <> 'nao_enviado'
  )
);
