
-- Allow banco to view documents for solicitations sent to them
CREATE POLICY "banco_select_docs" ON public.solicitacao_documentos
FOR SELECT USING (
  is_banco() AND solicitacao_id IN (
    SELECT id FROM solicitacoes_laudo 
    WHERE banco_parceiro_id = get_banco_parceiro_id() 
    AND status_banco != 'nao_enviado'
  )
);

-- Allow banco to view shared group documents for their solicitations
CREATE POLICY "banco_select_grupo_docs" ON public.grupo_documentos_compartilhados
FOR SELECT USING (
  is_banco() AND grupo_id IN (
    SELECT DISTINCT grupo_id FROM solicitacoes_laudo 
    WHERE banco_parceiro_id = get_banco_parceiro_id() 
    AND status_banco != 'nao_enviado'
    AND grupo_id IS NOT NULL
  )
);

-- Allow banco to read files from solicitacao-docs bucket for their solicitations
CREATE POLICY "banco_read_solicitacao_docs" ON storage.objects
FOR SELECT USING (bucket_id = 'solicitacao-docs' AND is_banco());
