
CREATE OR REPLACE FUNCTION public.is_coban_master()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'coban_master') $$;

CREATE OR REPLACE FUNCTION public.is_subestabelecido()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'subestabelecido') $$;

CREATE TABLE public.onboarding_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL DEFAULT '',
  razao_social text NOT NULL DEFAULT '',
  nome_fantasia text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'subestabelecido',
  parent_id uuid REFERENCES public.onboarding_empresas(id) ON DELETE SET NULL,
  user_id uuid,
  uf text NOT NULL DEFAULT '',
  municipio text NOT NULL DEFAULT '',
  endereco text DEFAULT '',
  telefone text DEFAULT '',
  email text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  regiao_atuacao text DEFAULT '',
  comissao_percentual numeric DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.onboarding_empresas(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  cpf text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text DEFAULT '',
  cargo text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.onboarding_empresas(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL DEFAULT '',
  nome_arquivo text NOT NULL DEFAULT '',
  caminho_arquivo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'enviado',
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.onboarding_empresas(id) ON DELETE CASCADE,
  item text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  verificado_por uuid,
  verificado_em timestamptz,
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.get_onboarding_empresa_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.onboarding_empresas WHERE user_id = auth.uid() LIMIT 1 $$;

ALTER TABLE public.onboarding_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oe_select" ON public.onboarding_empresas FOR SELECT TO authenticated
USING (is_admin() OR is_coban_master() OR (is_subestabelecido() AND (id = get_onboarding_empresa_id() OR parent_id = get_onboarding_empresa_id())));
CREATE POLICY "oe_insert" ON public.onboarding_empresas FOR INSERT TO authenticated
WITH CHECK (is_admin() OR is_coban_master() OR is_subestabelecido());
CREATE POLICY "oe_update" ON public.onboarding_empresas FOR UPDATE TO authenticated
USING (is_admin() OR is_coban_master() OR (is_subestabelecido() AND (id = get_onboarding_empresa_id() OR parent_id = get_onboarding_empresa_id())));
CREATE POLICY "oe_delete" ON public.onboarding_empresas FOR DELETE TO authenticated
USING (is_admin() OR is_coban_master());

CREATE POLICY "or_select" ON public.onboarding_responsaveis FOR SELECT TO authenticated
USING (is_admin() OR is_coban_master() OR (is_subestabelecido() AND (empresa_id = get_onboarding_empresa_id() OR empresa_id IN (SELECT id FROM public.onboarding_empresas WHERE parent_id = get_onboarding_empresa_id()))));
CREATE POLICY "or_insert" ON public.onboarding_responsaveis FOR INSERT TO authenticated
WITH CHECK (is_admin() OR is_coban_master() OR is_subestabelecido());
CREATE POLICY "or_update" ON public.onboarding_responsaveis FOR UPDATE TO authenticated
USING (is_admin() OR is_coban_master());
CREATE POLICY "or_delete" ON public.onboarding_responsaveis FOR DELETE TO authenticated
USING (is_admin() OR is_coban_master());

CREATE POLICY "od_select" ON public.onboarding_documentos FOR SELECT TO authenticated
USING (is_admin() OR is_coban_master() OR (is_subestabelecido() AND (empresa_id = get_onboarding_empresa_id() OR empresa_id IN (SELECT id FROM public.onboarding_empresas WHERE parent_id = get_onboarding_empresa_id()))));
CREATE POLICY "od_insert" ON public.onboarding_documentos FOR INSERT TO authenticated
WITH CHECK (is_admin() OR is_coban_master() OR is_subestabelecido());
CREATE POLICY "od_update" ON public.onboarding_documentos FOR UPDATE TO authenticated
USING (is_admin() OR is_coban_master());
CREATE POLICY "od_delete" ON public.onboarding_documentos FOR DELETE TO authenticated
USING (is_admin() OR is_coban_master());

CREATE POLICY "oc_select" ON public.onboarding_compliance FOR SELECT TO authenticated
USING (is_admin() OR is_coban_master() OR (is_subestabelecido() AND (empresa_id = get_onboarding_empresa_id() OR empresa_id IN (SELECT id FROM public.onboarding_empresas WHERE parent_id = get_onboarding_empresa_id()))));
CREATE POLICY "oc_insert" ON public.onboarding_compliance FOR INSERT TO authenticated
WITH CHECK (is_admin() OR is_coban_master());
CREATE POLICY "oc_update" ON public.onboarding_compliance FOR UPDATE TO authenticated
USING (is_admin() OR is_coban_master());
CREATE POLICY "oc_delete" ON public.onboarding_compliance FOR DELETE TO authenticated
USING (is_admin() OR is_coban_master());

CREATE TRIGGER update_onboarding_empresas_updated_at
  BEFORE UPDATE ON public.onboarding_empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_documentos_updated_at
  BEFORE UPDATE ON public.onboarding_documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.onboarding_empresas (id, cnpj, razao_social, nome_fantasia, tipo, status)
VALUES ('00000000-0000-0000-0000-000000000001', '00.000.000/0001-00', 'Guatã Serviços Financeiros Ltda', 'Guatã', 'master', 'ativo');

INSERT INTO storage.buckets (id, name, public) VALUES ('onboarding-docs', 'onboarding-docs', false);

CREATE POLICY "onb_docs_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'onboarding-docs' AND (is_admin() OR is_coban_master() OR is_subestabelecido()));
CREATE POLICY "onb_docs_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'onboarding-docs' AND (is_admin() OR is_coban_master() OR is_subestabelecido()));
CREATE POLICY "onb_docs_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'onboarding-docs' AND (is_admin() OR is_coban_master()));
