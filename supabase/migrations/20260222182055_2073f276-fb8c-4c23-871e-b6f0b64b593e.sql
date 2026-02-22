
-- 1. Add 'banco' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'banco';

-- 2. Create ZARC rules table
CREATE TABLE public.zarc_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultura TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  municipio TEXT NOT NULL DEFAULT '',
  tipo_solo TEXT NOT NULL DEFAULT '',
  ciclo TEXT NOT NULL DEFAULT '',
  periodo_plantio_inicio INTEGER,
  periodo_plantio_fim INTEGER,
  risco TEXT NOT NULL DEFAULT 'medio',
  safra TEXT NOT NULL DEFAULT '',
  observacoes TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zarc_cultura_uf ON public.zarc_regras(cultura, uf);
CREATE INDEX idx_zarc_municipio ON public.zarc_regras(municipio);

ALTER TABLE public.zarc_regras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zarc_select" ON public.zarc_regras FOR SELECT USING (true);
CREATE POLICY "zarc_insert" ON public.zarc_regras FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "zarc_update" ON public.zarc_regras FOR UPDATE USING (is_admin());
CREATE POLICY "zarc_delete" ON public.zarc_regras FOR DELETE USING (is_admin());

CREATE TRIGGER update_zarc_regras_updated_at
  BEFORE UPDATE ON public.zarc_regras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create banco_usuarios linking table
CREATE TABLE public.banco_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  banco_parceiro_id UUID NOT NULL REFERENCES public.bancos_parceiros(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.banco_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banco_usuarios_select" ON public.banco_usuarios FOR SELECT USING (true);
CREATE POLICY "banco_usuarios_insert" ON public.banco_usuarios FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "banco_usuarios_update" ON public.banco_usuarios FOR UPDATE USING (is_admin());
CREATE POLICY "banco_usuarios_delete" ON public.banco_usuarios FOR DELETE USING (is_admin());

-- 4. Helper functions
CREATE OR REPLACE FUNCTION public.get_banco_parceiro_id()
  RETURNS UUID
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT banco_parceiro_id FROM public.banco_usuarios WHERE user_id = auth.uid() LIMIT 1
$$;
