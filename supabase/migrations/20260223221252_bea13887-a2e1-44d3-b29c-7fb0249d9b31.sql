
-- 1. Trilhas de treinamento
CREATE TABLE public.treinamento_trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  icone text NOT NULL DEFAULT 'BookOpen',
  cor text NOT NULL DEFAULT '#3b82f6',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treinamento_trilhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trilhas_select" ON public.treinamento_trilhas FOR SELECT USING (true);
CREATE POLICY "trilhas_insert" ON public.treinamento_trilhas FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "trilhas_update" ON public.treinamento_trilhas FOR UPDATE USING (is_admin());
CREATE POLICY "trilhas_delete" ON public.treinamento_trilhas FOR DELETE USING (is_admin());

-- 2. Módulos de treinamento
CREATE TABLE public.treinamento_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id uuid NOT NULL REFERENCES public.treinamento_trilhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  duracao_minutos integer NOT NULL DEFAULT 30,
  ordem integer NOT NULL DEFAULT 0,
  obrigatorio boolean NOT NULL DEFAULT false,
  pre_requisito_id uuid REFERENCES public.treinamento_modulos(id) ON DELETE SET NULL,
  pontos integer NOT NULL DEFAULT 10,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treinamento_modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modulos_select" ON public.treinamento_modulos FOR SELECT USING (true);
CREATE POLICY "modulos_insert" ON public.treinamento_modulos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "modulos_update" ON public.treinamento_modulos FOR UPDATE USING (is_admin());
CREATE POLICY "modulos_delete" ON public.treinamento_modulos FOR DELETE USING (is_admin());

-- 3. Progresso individual do AgroBanker
CREATE TABLE public.treinamento_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id uuid NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES public.treinamento_modulos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'nao_iniciado',
  pontuacao integer NOT NULL DEFAULT 0,
  data_inicio timestamptz,
  data_conclusao timestamptz,
  tentativas integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agrobanker_id, modulo_id)
);

ALTER TABLE public.treinamento_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progresso_select" ON public.treinamento_progresso FOR SELECT
  USING ((agrobanker_id = get_agrobanker_id()) OR is_admin() OR is_mesa_produtos());
CREATE POLICY "progresso_insert" ON public.treinamento_progresso FOR INSERT
  WITH CHECK ((agrobanker_id = get_agrobanker_id()) OR is_admin());
CREATE POLICY "progresso_update" ON public.treinamento_progresso FOR UPDATE
  USING ((agrobanker_id = get_agrobanker_id()) OR is_admin());

-- 4. Definições de badges/certificações
CREATE TABLE public.treinamento_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  icone text NOT NULL DEFAULT 'Award',
  cor text NOT NULL DEFAULT '#f59e0b',
  criterio_tipo text NOT NULL DEFAULT 'trilha_completa',
  criterio_valor text NOT NULL DEFAULT '',
  pontos_bonus integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treinamento_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select" ON public.treinamento_badges FOR SELECT USING (true);
CREATE POLICY "badges_insert" ON public.treinamento_badges FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "badges_update" ON public.treinamento_badges FOR UPDATE USING (is_admin());
CREATE POLICY "badges_delete" ON public.treinamento_badges FOR DELETE USING (is_admin());

-- 5. Badges conquistados
CREATE TABLE public.treinamento_badges_conquistados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrobanker_id uuid NOT NULL REFERENCES public.agrobankers(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.treinamento_badges(id) ON DELETE CASCADE,
  data_conquista timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agrobanker_id, badge_id)
);

ALTER TABLE public.treinamento_badges_conquistados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_conq_select" ON public.treinamento_badges_conquistados FOR SELECT
  USING ((agrobanker_id = get_agrobanker_id()) OR is_admin() OR is_mesa_produtos());
CREATE POLICY "badges_conq_insert" ON public.treinamento_badges_conquistados FOR INSERT
  WITH CHECK (is_admin());

-- 6. Agenda de treinamentos (calendário)
CREATE TABLE public.treinamento_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  modulo_id uuid REFERENCES public.treinamento_modulos(id) ON DELETE SET NULL,
  data_evento date NOT NULL,
  hora_inicio time,
  hora_fim time,
  tipo text NOT NULL DEFAULT 'online',
  recorrencia text NOT NULL DEFAULT 'unico',
  obrigatorio boolean NOT NULL DEFAULT false,
  max_participantes integer,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treinamento_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agenda_select" ON public.treinamento_agenda FOR SELECT USING (true);
CREATE POLICY "agenda_insert" ON public.treinamento_agenda FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "agenda_update" ON public.treinamento_agenda FOR UPDATE USING (is_admin());
CREATE POLICY "agenda_delete" ON public.treinamento_agenda FOR DELETE USING (is_admin());

-- 7. SLA de treinamento
CREATE TABLE public.treinamento_sla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  prazo_dias integer NOT NULL DEFAULT 30,
  tipo text NOT NULL DEFAULT 'onboarding',
  penalidade text NOT NULL DEFAULT 'bloqueio_acesso',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treinamento_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tsla_select" ON public.treinamento_sla FOR SELECT USING (true);
CREATE POLICY "tsla_insert" ON public.treinamento_sla FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tsla_update" ON public.treinamento_sla FOR UPDATE USING (is_admin());
CREATE POLICY "tsla_delete" ON public.treinamento_sla FOR DELETE USING (is_admin());

-- Triggers updated_at
CREATE TRIGGER treinamento_trilhas_updated BEFORE UPDATE ON public.treinamento_trilhas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER treinamento_modulos_updated BEFORE UPDATE ON public.treinamento_modulos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER treinamento_progresso_updated BEFORE UPDATE ON public.treinamento_progresso FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER treinamento_agenda_updated BEFORE UPDATE ON public.treinamento_agenda FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER treinamento_sla_updated BEFORE UPDATE ON public.treinamento_sla FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
