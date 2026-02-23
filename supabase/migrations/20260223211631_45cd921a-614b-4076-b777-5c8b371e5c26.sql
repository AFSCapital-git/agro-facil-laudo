
-- 1. Table: agrobanker_produtos – which products each AgroBanker can offer
CREATE TABLE public.agrobanker_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id uuid NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  pronaf_produto_id uuid NOT NULL REFERENCES public.pronaf_produtos(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  comissao_percentual numeric NOT NULL DEFAULT 0,
  comissao_fixa numeric NOT NULL DEFAULT 0,
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agrobanker_id, pronaf_produto_id)
);
ALTER TABLE public.agrobanker_produtos ENABLE ROW LEVEL SECURITY;

-- 2. Table: agrobanker_regioes – regional restrictions
CREATE TABLE public.agrobanker_regioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id uuid NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  uf char(2) NOT NULL,
  municipio text DEFAULT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agrobanker_id, uf, municipio)
);
ALTER TABLE public.agrobanker_regioes ENABLE ROW LEVEL SECURITY;

-- 3. Table: agrobanker_metas – quotas / targets
CREATE TABLE public.agrobanker_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id uuid NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  meta_captacoes integer NOT NULL DEFAULT 0,
  meta_valor numeric NOT NULL DEFAULT 0,
  realizado_captacoes integer NOT NULL DEFAULT 0,
  realizado_valor numeric NOT NULL DEFAULT 0,
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agrobanker_metas ENABLE ROW LEVEL SECURITY;

-- 4. Table: agrobanker_convites – invitation flow
CREATE TABLE public.agrobanker_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id uuid NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome_produtor text DEFAULT '',
  cpf_cnpj text DEFAULT '',
  telefone text DEFAULT '',
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'pendente',
  produtor_id uuid REFERENCES public.produtores(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
ALTER TABLE public.agrobanker_convites ENABLE ROW LEVEL SECURITY;

-- RLS: agrobanker_produtos
CREATE POLICY "abprod_select" ON public.agrobanker_produtos FOR SELECT
  USING (agrobanker_id = get_agrobanker_id() OR is_admin() OR is_mesa_produtos());
CREATE POLICY "abprod_insert" ON public.agrobanker_produtos FOR INSERT
  WITH CHECK (is_admin() OR is_mesa_produtos());
CREATE POLICY "abprod_update" ON public.agrobanker_produtos FOR UPDATE
  USING (is_admin() OR is_mesa_produtos());
CREATE POLICY "abprod_delete" ON public.agrobanker_produtos FOR DELETE
  USING (is_admin() OR is_mesa_produtos());

-- RLS: agrobanker_regioes
CREATE POLICY "abreg_select" ON public.agrobanker_regioes FOR SELECT
  USING (agrobanker_id = get_agrobanker_id() OR is_admin() OR is_mesa_produtos());
CREATE POLICY "abreg_insert" ON public.agrobanker_regioes FOR INSERT
  WITH CHECK (is_admin() OR is_mesa_produtos());
CREATE POLICY "abreg_update" ON public.agrobanker_regioes FOR UPDATE
  USING (is_admin() OR is_mesa_produtos());
CREATE POLICY "abreg_delete" ON public.agrobanker_regioes FOR DELETE
  USING (is_admin() OR is_mesa_produtos());

-- RLS: agrobanker_metas
CREATE POLICY "abmeta_select" ON public.agrobanker_metas FOR SELECT
  USING (agrobanker_id = get_agrobanker_id() OR is_admin() OR is_mesa_produtos());
CREATE POLICY "abmeta_insert" ON public.agrobanker_metas FOR INSERT
  WITH CHECK (is_admin() OR is_mesa_produtos());
CREATE POLICY "abmeta_update" ON public.agrobanker_metas FOR UPDATE
  USING (is_admin() OR is_mesa_produtos());
CREATE POLICY "abmeta_delete" ON public.agrobanker_metas FOR DELETE
  USING (is_admin() OR is_mesa_produtos());

-- RLS: agrobanker_convites
CREATE POLICY "abconv_select" ON public.agrobanker_convites FOR SELECT
  USING (agrobanker_id = get_agrobanker_id() OR is_admin() OR is_mesa_produtos());
CREATE POLICY "abconv_insert" ON public.agrobanker_convites FOR INSERT
  WITH CHECK (agrobanker_id = get_agrobanker_id());
CREATE POLICY "abconv_update" ON public.agrobanker_convites FOR UPDATE
  USING (agrobanker_id = get_agrobanker_id() OR is_admin());
CREATE POLICY "abconv_delete" ON public.agrobanker_convites FOR DELETE
  USING (agrobanker_id = get_agrobanker_id() OR is_admin());

-- updated_at triggers
CREATE TRIGGER set_updated_at_agrobanker_produtos BEFORE UPDATE ON public.agrobanker_produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_agrobanker_metas BEFORE UPDATE ON public.agrobanker_metas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
