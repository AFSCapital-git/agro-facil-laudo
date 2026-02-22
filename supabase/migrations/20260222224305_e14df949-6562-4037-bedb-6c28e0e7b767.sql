
-- Allow mesa_produtos to view laudo media
DROP POLICY IF EXISTS "midia_select" ON public.midia_laudo;

CREATE POLICY "midia_select" ON public.midia_laudo
FOR SELECT USING (
  (laudo_id IN (SELECT laudos.id FROM laudos WHERE laudos.engenheiro_id = get_engenheiro_id()))
  OR is_admin()
  OR is_mesa_produtos()
  OR (laudo_id IN (
    SELECT l.id FROM laudos l
    JOIN solicitacoes_laudo s ON l.solicitacao_id = s.id
    WHERE s.produtor_id = get_produtor_id()
  ))
  OR (is_banco() AND laudo_id IN (
    SELECT l.id FROM laudos l
    JOIN solicitacoes_laudo s ON l.solicitacao_id = s.id
    WHERE s.banco_parceiro_id = get_banco_parceiro_id()
    AND s.status_banco != 'nao_enviado'
  ))
);
