
-- Tabela principal de consultas de enquadramento
CREATE TABLE public.consulta_enquadramento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produtor_id uuid NOT NULL,
  solicitacao_id uuid REFERENCES public.solicitacoes_laudo(id) ON DELETE SET NULL,
  pronaf_produto_sugerido_id uuid REFERENCES public.pronaf_produtos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'em_andamento',
  produto_sugerido_nome text DEFAULT '',
  capitulo_mcr text DEFAULT '',
  justificativa text DEFAULT '',
  condicoes_resumo text DEFAULT '',
  dados_contexto jsonb DEFAULT '{}'::jsonb,
  resultado_enquadramento jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz
);

-- Tabela de mensagens do chat de enquadramento
CREATE TABLE public.consulta_enquadramento_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id uuid NOT NULL REFERENCES public.consulta_enquadramento(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers de updated_at
CREATE TRIGGER update_consulta_enquadramento_updated_at
  BEFORE UPDATE ON public.consulta_enquadramento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS consulta_enquadramento
ALTER TABLE public.consulta_enquadramento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ce_select" ON public.consulta_enquadramento FOR SELECT TO authenticated
  USING (
    (produtor_id = get_produtor_id())
    OR is_admin()
    OR is_mesa_produtos()
    OR is_engenheiro()
    OR is_banco()
  );

CREATE POLICY "ce_insert" ON public.consulta_enquadramento FOR INSERT TO authenticated
  WITH CHECK (produtor_id = get_produtor_id());

CREATE POLICY "ce_update" ON public.consulta_enquadramento FOR UPDATE TO authenticated
  USING (produtor_id = get_produtor_id() OR is_admin());

-- RLS consulta_enquadramento_mensagens
ALTER TABLE public.consulta_enquadramento_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cem_select" ON public.consulta_enquadramento_mensagens FOR SELECT TO authenticated
  USING (
    consulta_id IN (SELECT id FROM public.consulta_enquadramento)
  );

CREATE POLICY "cem_insert" ON public.consulta_enquadramento_mensagens FOR INSERT TO authenticated
  WITH CHECK (
    consulta_id IN (SELECT id FROM public.consulta_enquadramento WHERE produtor_id = get_produtor_id())
  );

-- Coluna enquadramento_id na solicitacoes_laudo
ALTER TABLE public.solicitacoes_laudo 
  ADD COLUMN IF NOT EXISTS enquadramento_id uuid REFERENCES public.consulta_enquadramento(id) ON DELETE SET NULL;
