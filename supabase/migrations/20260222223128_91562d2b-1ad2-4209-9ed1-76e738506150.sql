
-- Allow banco to update status_banco and observacoes on their solicitations
DROP POLICY IF EXISTS "solicitacoes_update" ON public.solicitacoes_laudo;

CREATE POLICY "solicitacoes_update" ON public.solicitacoes_laudo
FOR UPDATE USING (
  (produtor_id = get_produtor_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_engenheiro() AND (
    (id IN (SELECT get_engenheiro_laudo_solicitacao_ids()))
    OR (engenheiro_atribuido_id = get_engenheiro_id())
    OR (assistido = true AND engenheiro_assistente_id = get_engenheiro_id())
  ))
  OR (is_banco() AND banco_parceiro_id = get_banco_parceiro_id() AND status_banco != 'nao_enviado')
);
