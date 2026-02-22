
-- Tabela de Feature Flags genérica
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL,
  valor JSONB NOT NULL DEFAULT 'true'::jsonb,
  escopo_tipo TEXT NOT NULL DEFAULT 'global',
  escopo_id TEXT,
  descricao TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index que trata NULL corretamente
CREATE UNIQUE INDEX uq_feature_flags_chave_escopo
  ON public.feature_flags (chave, escopo_tipo, COALESCE(escopo_id, '__global__'));

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_select" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "flags_insert" ON public.feature_flags FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "flags_update" ON public.feature_flags FOR UPDATE USING (is_admin());
CREATE POLICY "flags_delete" ON public.feature_flags FOR DELETE USING (is_admin());

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
