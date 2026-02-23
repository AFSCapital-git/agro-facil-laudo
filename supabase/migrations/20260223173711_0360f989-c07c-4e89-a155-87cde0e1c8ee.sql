
-- 1. Create agrobankers table
CREATE TABLE public.agrobankers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cnpj TEXT NOT NULL DEFAULT '',
  razao_social TEXT NOT NULL DEFAULT '',
  nome_fantasia TEXT NOT NULL DEFAULT '',
  tipo_entidade TEXT NOT NULL DEFAULT 'outro',
  descricao_tipo TEXT DEFAULT '',
  telefone_comercial TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  municipio TEXT DEFAULT '',
  uf CHAR(2) DEFAULT '',
  status_verificacao TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agrobankers ENABLE ROW LEVEL SECURITY;

-- 2. Create agrobanker_produtores
CREATE TABLE public.agrobanker_produtores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id UUID NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  produtor_id UUID NOT NULL REFERENCES public.produtores(id) ON DELETE CASCADE,
  nivel_acesso TEXT NOT NULL DEFAULT 'indicacao',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agrobanker_id, produtor_id)
);

ALTER TABLE public.agrobanker_produtores ENABLE ROW LEVEL SECURITY;

-- 3. Create agrobanker_comissoes
CREATE TABLE public.agrobanker_comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id UUID NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  solicitacao_id UUID REFERENCES public.solicitacoes_laudo(id),
  tipo TEXT NOT NULL DEFAULT 'laudo_fechado',
  valor NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_pagamento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agrobanker_comissoes ENABLE ROW LEVEL SECURITY;

-- 4. Add agrobanker_id FK to solicitacoes_laudo
ALTER TABLE public.solicitacoes_laudo 
  ADD COLUMN IF NOT EXISTS agrobanker_id UUID REFERENCES public.agrobankers(id);

-- 5. Helper functions
CREATE OR REPLACE FUNCTION public.is_agrobanker()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'agrobanker')
$$;

CREATE OR REPLACE FUNCTION public.get_agrobanker_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.agrobankers WHERE user_id = auth.uid() LIMIT 1
$$;

-- 6. Updated_at triggers
CREATE TRIGGER set_agrobankers_updated_at
  BEFORE UPDATE ON public.agrobankers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_agrobanker_produtores_updated_at
  BEFORE UPDATE ON public.agrobanker_produtores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_agrobanker_comissoes_updated_at
  BEFORE UPDATE ON public.agrobanker_comissoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RLS - agrobankers
CREATE POLICY "agrobankers_insert" ON public.agrobankers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "agrobankers_select" ON public.agrobankers
  FOR SELECT USING (user_id = auth.uid() OR is_admin() OR is_mesa_produtos());

CREATE POLICY "agrobankers_update" ON public.agrobankers
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- 8. RLS - agrobanker_produtores
CREATE POLICY "abp_select" ON public.agrobanker_produtores
  FOR SELECT USING (agrobanker_id = get_agrobanker_id() OR is_admin() OR is_mesa_produtos());

CREATE POLICY "abp_insert" ON public.agrobanker_produtores
  FOR INSERT WITH CHECK (agrobanker_id = get_agrobanker_id());

CREATE POLICY "abp_update" ON public.agrobanker_produtores
  FOR UPDATE USING (agrobanker_id = get_agrobanker_id() OR is_admin());

CREATE POLICY "abp_delete" ON public.agrobanker_produtores
  FOR DELETE USING (agrobanker_id = get_agrobanker_id() OR is_admin());

-- 9. RLS - agrobanker_comissoes
CREATE POLICY "abc_select" ON public.agrobanker_comissoes
  FOR SELECT USING (agrobanker_id = get_agrobanker_id() OR is_admin());

CREATE POLICY "abc_insert" ON public.agrobanker_comissoes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "abc_update" ON public.agrobanker_comissoes
  FOR UPDATE USING (is_admin());
