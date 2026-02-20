
-- Add docs_habilitados flag to solicitacoes_laudo
ALTER TABLE public.solicitacoes_laudo 
ADD COLUMN docs_habilitados boolean NOT NULL DEFAULT false;

-- Create table for producer document uploads
CREATE TABLE public.solicitacao_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes_laudo(id) ON DELETE CASCADE,
  pronaf_documento_id uuid REFERENCES public.pronaf_documentos(id),
  nome_arquivo text NOT NULL,
  caminho_arquivo text NOT NULL,
  status_documento text NOT NULL DEFAULT 'enviado',
  observacoes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitacao_documentos ENABLE ROW LEVEL SECURITY;

-- Producer can insert docs for their own solicitations when docs are enabled
CREATE POLICY "produtor_insert_docs"
ON public.solicitacao_documentos
FOR INSERT
WITH CHECK (
  solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
  AND EXISTS (
    SELECT 1 FROM public.solicitacoes_laudo 
    WHERE id = solicitacao_id AND docs_habilitados = true
  )
);

-- Producer can view their own docs
CREATE POLICY "produtor_select_docs"
ON public.solicitacao_documentos
FOR SELECT
USING (
  solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
  OR is_admin()
  OR is_mesa_produtos()
);

-- Producer can delete their own docs
CREATE POLICY "produtor_delete_docs"
ON public.solicitacao_documentos
FOR DELETE
USING (
  solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
);

-- Admin/Mesa can update doc status
CREATE POLICY "mesa_update_docs"
ON public.solicitacao_documentos
FOR UPDATE
USING (is_admin() OR is_mesa_produtos());

-- Trigger for updated_at
CREATE TRIGGER update_solicitacao_documentos_updated_at
BEFORE UPDATE ON public.solicitacao_documentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for solicitation documents
INSERT INTO storage.buckets (id, name, public) VALUES ('solicitacao-docs', 'solicitacao-docs', false);

-- Storage policies for document uploads
CREATE POLICY "produtor_upload_docs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'solicitacao-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "produtor_select_docs_storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'solicitacao-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "produtor_delete_docs_storage"
ON storage.objects
FOR DELETE
USING (bucket_id = 'solicitacao-docs' AND auth.uid() IS NOT NULL);
