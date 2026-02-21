
-- =============================================
-- BLOCO 3: SLA, Regiões, Bancos, Blacklist
-- =============================================

-- 1. REGIÕES
CREATE TABLE public.regioes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.regioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regioes_select" ON public.regioes FOR SELECT USING (true);
CREATE POLICY "regioes_insert" ON public.regioes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "regioes_update" ON public.regioes FOR UPDATE USING (is_admin());
CREATE POLICY "regioes_delete" ON public.regioes FOR DELETE USING (is_admin());

-- Add region FK to engenheiros and propriedades
ALTER TABLE public.engenheiros ADD COLUMN regiao_id UUID REFERENCES public.regioes(id) ON DELETE SET NULL;
ALTER TABLE public.propriedades ADD COLUMN regiao_id UUID REFERENCES public.regioes(id) ON DELETE SET NULL;

-- 2. BANCOS PARCEIROS
CREATE TABLE public.bancos_parceiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bancos_parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bancos_select" ON public.bancos_parceiros FOR SELECT USING (true);
CREATE POLICY "bancos_insert" ON public.bancos_parceiros FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "bancos_update" ON public.bancos_parceiros FOR UPDATE USING (is_admin());
CREATE POLICY "bancos_delete" ON public.bancos_parceiros FOR DELETE USING (is_admin());

-- Add banco FK to solicitacoes_laudo (keep banco_destino text for legacy)
ALTER TABLE public.solicitacoes_laudo ADD COLUMN banco_parceiro_id UUID REFERENCES public.bancos_parceiros(id) ON DELETE SET NULL;

-- 3. SLA CONFIG
CREATE TABLE public.sla_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_solicitacao TEXT NOT NULL UNIQUE,
  prazo_horas INTEGER NOT NULL DEFAULT 48,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sla_select" ON public.sla_config FOR SELECT USING (true);
CREATE POLICY "sla_insert" ON public.sla_config FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "sla_update" ON public.sla_config FOR UPDATE USING (is_admin());
CREATE POLICY "sla_delete" ON public.sla_config FOR DELETE USING (is_admin());

-- Add global SLA to configuracoes
ALTER TABLE public.configuracoes_plataforma ADD COLUMN sla_global_dias INTEGER NOT NULL DEFAULT 15;

-- Seed default SLA values
INSERT INTO public.sla_config (status_solicitacao, prazo_horas) VALUES
  ('pendente', 24),
  ('em_analise_mesa', 48),
  ('docs_pendentes_produtor', 120),
  ('docs_em_validacao', 48),
  ('elegivel', 72),
  ('aguardando_laudo', 168),
  ('pronta_para_banco', 48);

-- 4. BLACKLIST
CREATE TABLE public.blacklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('produtor', 'engenheiro')),
  motivo TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blacklist_select" ON public.blacklist FOR SELECT USING (is_admin());
CREATE POLICY "blacklist_insert" ON public.blacklist FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "blacklist_update" ON public.blacklist FOR UPDATE USING (is_admin());
CREATE POLICY "blacklist_delete" ON public.blacklist FOR DELETE USING (is_admin());
