
-- =============================================
-- 1. FIX STORAGE BUCKET POLICIES
-- =============================================

-- Drop existing permissive policies for laudo-media
DROP POLICY IF EXISTS "media_select" ON storage.objects;
DROP POLICY IF EXISTS "media_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_delete" ON storage.objects;

-- Drop existing permissive policies for laudo-pdfs
DROP POLICY IF EXISTS "pdfs_select" ON storage.objects;
DROP POLICY IF EXISTS "pdfs_insert" ON storage.objects;

-- Drop existing permissive policies for solicitacao-docs
DROP POLICY IF EXISTS "produtor_upload_docs" ON storage.objects;
DROP POLICY IF EXISTS "produtor_select_docs_storage" ON storage.objects;
DROP POLICY IF EXISTS "produtor_delete_docs_storage" ON storage.objects;
DROP POLICY IF EXISTS "banco_read_solicitacao_docs" ON storage.objects;

-- =============================================
-- LAUDO-MEDIA: ownership-based policies
-- =============================================

-- Helper: get laudo IDs for current engenheiro (folder name = laudo_id)
CREATE OR REPLACE FUNCTION public.get_engenheiro_laudo_ids()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id::text FROM public.laudos WHERE engenheiro_id = get_engenheiro_id()
$$;

-- Helper: get laudo IDs for current produtor
CREATE OR REPLACE FUNCTION public.get_produtor_laudo_ids()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT l.id::text FROM public.laudos l
  JOIN public.solicitacoes_laudo s ON l.solicitacao_id = s.id
  WHERE s.produtor_id = get_produtor_id()
$$;

-- SELECT: engenheiro dono + produtor dono + admin + mesa + banco (se enviado)
CREATE POLICY "media_select_v2" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'laudo-media' AND (
    is_admin() OR is_mesa_produtos() OR
    (is_engenheiro() AND (storage.foldername(name))[1] IN (SELECT get_engenheiro_laudo_ids())) OR
    (is_produtor() AND (storage.foldername(name))[1] IN (SELECT get_produtor_laudo_ids())) OR
    (is_banco() AND (storage.foldername(name))[1] IN (
      SELECT l.id::text FROM laudos l
      JOIN solicitacoes_laudo s ON l.solicitacao_id = s.id
      WHERE s.banco_parceiro_id = get_banco_parceiro_id() AND s.status_banco <> 'nao_enviado'
    ))
  )
);

-- INSERT: only engenheiro dono do laudo
CREATE POLICY "media_insert_v2" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'laudo-media' AND (
    is_admin() OR
    (is_engenheiro() AND (storage.foldername(name))[1] IN (SELECT get_engenheiro_laudo_ids()))
  )
);

-- DELETE: engenheiro dono + admin
CREATE POLICY "media_delete_v2" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'laudo-media' AND (
    is_admin() OR
    (is_engenheiro() AND (storage.foldername(name))[1] IN (SELECT get_engenheiro_laudo_ids()))
  )
);

-- =============================================
-- LAUDO-PDFS: restricted policies
-- =============================================

CREATE POLICY "pdfs_select_v2" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'laudo-pdfs' AND (
    is_admin() OR is_mesa_produtos() OR
    (is_engenheiro() AND (storage.foldername(name))[1] IN (SELECT get_engenheiro_laudo_ids())) OR
    (is_produtor() AND (storage.foldername(name))[1] IN (SELECT get_produtor_laudo_ids())) OR
    (is_banco() AND (storage.foldername(name))[1] IN (
      SELECT l.id::text FROM laudos l
      JOIN solicitacoes_laudo s ON l.solicitacao_id = s.id
      WHERE s.banco_parceiro_id = get_banco_parceiro_id() AND s.status_banco <> 'nao_enviado'
    ))
  )
);

-- INSERT: only service role (edge function) or admin
CREATE POLICY "pdfs_insert_v2" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'laudo-pdfs' AND is_admin()
);

-- DELETE: admin only
CREATE POLICY "pdfs_delete_v2" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'laudo-pdfs' AND is_admin()
);

-- =============================================
-- SOLICITACAO-DOCS: ownership-based policies
-- =============================================

-- Helper: get solicitacao IDs folder names for current produtor
CREATE OR REPLACE FUNCTION public.get_produtor_solicitacao_id_texts()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id::text FROM public.solicitacoes_laudo
  WHERE produtor_id = get_produtor_id()
$$;

-- Helper: get solicitacao IDs for current engenheiro (atribuido or assistente)
CREATE OR REPLACE FUNCTION public.get_engenheiro_solicitacao_id_texts()
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id::text FROM public.solicitacoes_laudo
  WHERE engenheiro_atribuido_id = get_engenheiro_id()
     OR (assistido = true AND engenheiro_assistente_id = get_engenheiro_id())
$$;

-- SELECT: produtor dono + engenheiro atribuído + mesa + admin + banco
CREATE POLICY "docs_select_v2" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'solicitacao-docs' AND (
    is_admin() OR is_mesa_produtos() OR
    (is_produtor() AND (storage.foldername(name))[1] IN (SELECT get_produtor_solicitacao_id_texts())) OR
    (is_engenheiro() AND (storage.foldername(name))[1] IN (SELECT get_engenheiro_solicitacao_id_texts())) OR
    (is_banco() AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM solicitacoes_laudo
      WHERE banco_parceiro_id = get_banco_parceiro_id() AND status_banco <> 'nao_enviado'
    ))
  )
);

-- INSERT: produtor dono + engenheiro assistente + admin
CREATE POLICY "docs_insert_v2" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'solicitacao-docs' AND (
    is_admin() OR
    (is_produtor() AND (storage.foldername(name))[1] IN (SELECT get_produtor_solicitacao_id_texts())) OR
    (is_engenheiro() AND (storage.foldername(name))[1] IN (SELECT get_engenheiro_solicitacao_id_texts()))
  )
);

-- DELETE: produtor dono + admin
CREATE POLICY "docs_delete_v2" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'solicitacao-docs' AND (
    is_admin() OR
    (is_produtor() AND (storage.foldername(name))[1] IN (SELECT get_produtor_solicitacao_id_texts()))
  )
);
