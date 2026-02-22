
-- =============================================
-- 1. Tabela grupos_solicitacao (solicitação-mãe)
-- =============================================
CREATE TABLE public.grupos_solicitacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produtor_id UUID NOT NULL REFERENCES public.produtores(id),
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id),
  assistido BOOLEAN NOT NULL DEFAULT false,
  engenheiro_assistente_id UUID REFERENCES public.engenheiros(id),
  observacoes_produtor TEXT DEFAULT '',
  valor_assistencia NUMERIC DEFAULT NULL,
  tipo_valor_assistencia TEXT DEFAULT NULL, -- 'fixo' | 'percentual'
  status_grupo TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, concluido, cancelado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grupos_solicitacao ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER update_grupos_solicitacao_updated_at
  BEFORE UPDATE ON public.grupos_solicitacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Produtor dono
CREATE POLICY "grupos_insert_produtor" ON public.grupos_solicitacao
  FOR INSERT WITH CHECK (produtor_id = get_produtor_id());

CREATE POLICY "grupos_select" ON public.grupos_solicitacao
  FOR SELECT USING (
    produtor_id = get_produtor_id()
    OR is_admin()
    OR is_mesa_produtos()
    OR (is_engenheiro() AND assistido = true AND engenheiro_assistente_id = get_engenheiro_id())
  );

CREATE POLICY "grupos_update" ON public.grupos_solicitacao
  FOR UPDATE USING (
    produtor_id = get_produtor_id()
    OR is_admin()
    OR is_mesa_produtos()
  );

-- =============================================
-- 2. Adicionar grupo_id em solicitacoes_laudo
-- =============================================
ALTER TABLE public.solicitacoes_laudo
  ADD COLUMN grupo_id UUID REFERENCES public.grupos_solicitacao(id);

-- =============================================
-- 3. Tabela grupo_documentos_compartilhados
-- =============================================
CREATE TABLE public.grupo_documentos_compartilhados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID NOT NULL REFERENCES public.grupos_solicitacao(id) ON DELETE CASCADE,
  pronaf_documento_id UUID REFERENCES public.pronaf_documentos(id),
  nome_documento TEXT NOT NULL DEFAULT '',
  caminho_arquivo TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  status_documento TEXT NOT NULL DEFAULT 'enviado', -- enviado, validado, recusado
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grupo_documentos_compartilhados ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_grupo_docs_updated_at
  BEFORE UPDATE ON public.grupo_documentos_compartilhados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get produtor grupo IDs
CREATE OR REPLACE FUNCTION public.get_produtor_grupo_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.grupos_solicitacao
  WHERE produtor_id = (SELECT id FROM public.produtores WHERE user_id = auth.uid() LIMIT 1)
$$;

-- Helper function to get engenheiro assistente grupo IDs
CREATE OR REPLACE FUNCTION public.get_engenheiro_assistente_grupo_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.grupos_solicitacao
  WHERE assistido = true
    AND engenheiro_assistente_id = (SELECT id FROM public.engenheiros WHERE user_id = auth.uid() LIMIT 1)
$$;

-- RLS grupo_documentos_compartilhados
-- Produtor pode inserir se grupo pertence a ele e docs habilitados em pelo menos uma sub
CREATE POLICY "grupo_docs_insert_produtor" ON public.grupo_documentos_compartilhados
  FOR INSERT WITH CHECK (
    grupo_id IN (SELECT get_produtor_grupo_ids())
    AND EXISTS (
      SELECT 1 FROM public.solicitacoes_laudo sl
      WHERE sl.grupo_id = grupo_documentos_compartilhados.grupo_id
        AND sl.docs_habilitados = true
    )
  );

-- Engenheiro assistente pode inserir docs
CREATE POLICY "grupo_docs_insert_engenheiro" ON public.grupo_documentos_compartilhados
  FOR INSERT WITH CHECK (
    is_engenheiro()
    AND grupo_id IN (SELECT get_engenheiro_assistente_grupo_ids())
    AND EXISTS (
      SELECT 1 FROM public.solicitacoes_laudo sl
      WHERE sl.grupo_id = grupo_documentos_compartilhados.grupo_id
        AND sl.docs_habilitados = true
    )
  );

CREATE POLICY "grupo_docs_select" ON public.grupo_documentos_compartilhados
  FOR SELECT USING (
    grupo_id IN (SELECT get_produtor_grupo_ids())
    OR is_admin()
    OR is_mesa_produtos()
    OR (is_engenheiro() AND grupo_id IN (SELECT get_engenheiro_assistente_grupo_ids()))
  );

-- Mesa/Admin pode atualizar status dos docs
CREATE POLICY "grupo_docs_update_mesa" ON public.grupo_documentos_compartilhados
  FOR UPDATE USING (is_admin() OR is_mesa_produtos());

-- Produtor pode deletar seus docs
CREATE POLICY "grupo_docs_delete_produtor" ON public.grupo_documentos_compartilhados
  FOR DELETE USING (grupo_id IN (SELECT get_produtor_grupo_ids()));

-- Engenheiro assistente pode deletar docs
CREATE POLICY "grupo_docs_delete_engenheiro" ON public.grupo_documentos_compartilhados
  FOR DELETE USING (
    is_engenheiro()
    AND grupo_id IN (SELECT get_engenheiro_assistente_grupo_ids())
  );
