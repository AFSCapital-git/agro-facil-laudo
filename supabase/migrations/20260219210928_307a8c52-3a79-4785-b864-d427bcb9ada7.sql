
-- =============================================
-- AgroLaudo - Schema Completo
-- =============================================

-- 1. ENUM de roles
CREATE TYPE public.app_role AS ENUM ('produtor', 'engenheiro', 'admin');

-- 2. Tabela de perfis (criada automaticamente no signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de roles (separada)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Produtores
CREATE TABLE public.produtores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cpf_cnpj TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produtores ENABLE ROW LEVEL SECURITY;

-- 5. Engenheiros
CREATE TABLE public.engenheiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  crea TEXT NOT NULL DEFAULT '',
  area_atuacao TEXT DEFAULT '',
  raio_atendimento_km INTEGER DEFAULT 100,
  conta_bancaria_banco TEXT DEFAULT '',
  conta_bancaria_agencia TEXT DEFAULT '',
  conta_bancaria_conta TEXT DEFAULT '',
  conta_bancaria_tipo TEXT DEFAULT 'corrente',
  status_verificacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_verificacao IN ('pendente', 'aprovado', 'reprovado')),
  rating NUMERIC(3,2) DEFAULT NULL,
  total_laudos_concluidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.engenheiros ENABLE ROW LEVEL SECURITY;

-- 6. Propriedades
CREATE TABLE public.propriedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produtor_id UUID NOT NULL REFERENCES public.produtores(id) ON DELETE CASCADE,
  nome_propriedade TEXT NOT NULL,
  endereco TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION DEFAULT NULL,
  longitude DOUBLE PRECISION DEFAULT NULL,
  area_total_ha NUMERIC(10,2) NOT NULL DEFAULT 0,
  codigo_car TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.propriedades ENABLE ROW LEVEL SECURITY;

-- 7. Solicitações de Laudo
CREATE TABLE public.solicitacoes_laudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produtor_id UUID NOT NULL REFERENCES public.produtores(id) ON DELETE CASCADE,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  tipo_credito TEXT NOT NULL DEFAULT 'custeio',
  valor_solicitado NUMERIC(12,2) NOT NULL DEFAULT 0,
  cultura_principal TEXT NOT NULL DEFAULT '',
  area_cultivo_ha NUMERIC(10,2) NOT NULL DEFAULT 0,
  status_solicitacao TEXT NOT NULL DEFAULT 'aberta' CHECK (status_solicitacao IN ('aberta', 'aguardando_eng', 'em_andamento', 'concluida', 'cancelada', 'ineligivel')),
  observacoes_produtor TEXT DEFAULT '',
  banco_destino TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitacoes_laudo ENABLE ROW LEVEL SECURITY;

-- 8. Laudos
CREATE TABLE public.laudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_laudo(id) ON DELETE CASCADE,
  engenheiro_id UUID NOT NULL REFERENCES public.engenheiros(id) ON DELETE CASCADE,
  status_laudo TEXT NOT NULL DEFAULT 'em_vistoria' CHECK (status_laudo IN ('em_vistoria', 'aguardando_assinatura', 'finalizado')),
  data_agendada_visita DATE DEFAULT NULL,
  data_visita_efetiva DATE DEFAULT NULL,
  situacao_cultura TEXT DEFAULT '',
  tipo_solo TEXT DEFAULT '',
  historico_produtividade TEXT DEFAULT '',
  disponibilidade_hidrica TEXT DEFAULT '',
  riscos_identificados TEXT DEFAULT '',
  garantias_observadas TEXT DEFAULT '',
  observacoes_adicionais TEXT DEFAULT '',
  resumo_viabilidade TEXT DEFAULT '',
  recomendacoes_tecnicas TEXT DEFAULT '',
  parecer_final TEXT DEFAULT NULL CHECK (parecer_final IS NULL OR parecer_final IN ('viavel', 'parcialmente_viavel', 'inviavel')),
  caminho_pdf_laudo TEXT DEFAULT NULL,
  score_risco NUMERIC(5,2) DEFAULT NULL,
  observacoes_internas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

-- 9. Mídia do Laudo
CREATE TABLE public.midia_laudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laudo_id UUID NOT NULL REFERENCES public.laudos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'foto' CHECK (tipo IN ('foto', 'documento')),
  url_arquivo TEXT NOT NULL,
  latitude DOUBLE PRECISION DEFAULT NULL,
  longitude DOUBLE PRECISION DEFAULT NULL,
  data_hora_captura TIMESTAMPTZ DEFAULT now(),
  descricao TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.midia_laudo ENABLE ROW LEVEL SECURITY;

-- 10. Assinatura do Laudo
CREATE TABLE public.assinatura_laudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laudo_id UUID NOT NULL REFERENCES public.laudos(id) ON DELETE CASCADE UNIQUE,
  engenheiro_id UUID NOT NULL REFERENCES public.engenheiros(id) ON DELETE CASCADE,
  hash_assinatura TEXT NOT NULL,
  data_hora_assinatura TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_assinatura TEXT DEFAULT '',
  tipo_assinatura TEXT NOT NULL DEFAULT 'simples_mvp' CHECK (tipo_assinatura IN ('simples_mvp', 'avancada_icp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assinatura_laudo ENABLE ROW LEVEL SECURITY;

-- 11. Pagamentos ao Engenheiro
CREATE TABLE public.pagamentos_engenheiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laudo_id UUID NOT NULL REFERENCES public.laudos(id) ON DELETE CASCADE UNIQUE,
  engenheiro_id UUID NOT NULL REFERENCES public.engenheiros(id) ON DELETE CASCADE,
  valor_bruto NUMERIC(10,2) NOT NULL DEFAULT 0,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'processando', 'pago')),
  data_prevista_pagamento DATE DEFAULT NULL,
  data_pagamento DATE DEFAULT NULL,
  metodo_pagamento TEXT NOT NULL DEFAULT 'manual' CHECK (metodo_pagamento IN ('manual', 'pix_api')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagamentos_engenheiro ENABLE ROW LEVEL SECURITY;

-- 12. Configurações da Plataforma
CREATE TABLE public.configuracoes_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_base_laudo NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  percentual_taxa_plataforma NUMERIC(5,2) NOT NULL DEFAULT 0,
  prazo_padrao_pagamento_dias INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.configuracoes_plataforma ENABLE ROW LEVEL SECURITY;

-- Inserir configuração padrão
INSERT INTO public.configuracoes_plataforma (valor_base_laudo, prazo_padrao_pagamento_dias) VALUES (500.00, 7);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_produtor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'produtor')
$$;

CREATE OR REPLACE FUNCTION public.is_engenheiro()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'engenheiro')
$$;

CREATE OR REPLACE FUNCTION public.get_produtor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.produtores WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_engenheiro_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.engenheiros WHERE user_id = auth.uid() LIMIT 1
$$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_produtores_updated_at BEFORE UPDATE ON public.produtores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_engenheiros_updated_at BEFORE UPDATE ON public.engenheiros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_propriedades_updated_at BEFORE UPDATE ON public.propriedades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes_laudo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_laudos_updated_at BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos_engenheiro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes_plataforma FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: everyone authenticated can read, own user can update
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- User roles: only admins manage, users can read own role
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "roles_insert_admin" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "roles_update_admin" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- Produtores: own user or admin
CREATE POLICY "produtores_select" ON public.produtores FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "produtores_insert" ON public.produtores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "produtores_update" ON public.produtores FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Engenheiros: own user or admin
CREATE POLICY "engenheiros_select" ON public.engenheiros FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "engenheiros_insert" ON public.engenheiros FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "engenheiros_update" ON public.engenheiros FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Propriedades: produtor owns or admin
CREATE POLICY "propriedades_select" ON public.propriedades FOR SELECT TO authenticated
  USING (produtor_id = public.get_produtor_id() OR public.is_admin());
CREATE POLICY "propriedades_insert" ON public.propriedades FOR INSERT TO authenticated
  WITH CHECK (produtor_id = public.get_produtor_id());
CREATE POLICY "propriedades_update" ON public.propriedades FOR UPDATE TO authenticated
  USING (produtor_id = public.get_produtor_id() OR public.is_admin());
CREATE POLICY "propriedades_delete" ON public.propriedades FOR DELETE TO authenticated
  USING (produtor_id = public.get_produtor_id() OR public.is_admin());

-- Solicitações: produtor (own), engenheiro (abertas + atribuídas), admin (all)
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_laudo FOR SELECT TO authenticated
  USING (
    produtor_id = public.get_produtor_id()
    OR public.is_admin()
    OR (public.is_engenheiro() AND (status_solicitacao = 'aberta' OR id IN (SELECT solicitacao_id FROM public.laudos WHERE engenheiro_id = public.get_engenheiro_id())))
  );
CREATE POLICY "solicitacoes_insert" ON public.solicitacoes_laudo FOR INSERT TO authenticated
  WITH CHECK (produtor_id = public.get_produtor_id());
CREATE POLICY "solicitacoes_update" ON public.solicitacoes_laudo FOR UPDATE TO authenticated
  USING (produtor_id = public.get_produtor_id() OR public.is_admin());

-- Laudos: engenheiro (own), produtor (da solicitação), admin
CREATE POLICY "laudos_select" ON public.laudos FOR SELECT TO authenticated
  USING (
    engenheiro_id = public.get_engenheiro_id()
    OR public.is_admin()
    OR (public.is_produtor() AND solicitacao_id IN (SELECT id FROM public.solicitacoes_laudo WHERE produtor_id = public.get_produtor_id()))
  );
CREATE POLICY "laudos_insert" ON public.laudos FOR INSERT TO authenticated
  WITH CHECK (engenheiro_id = public.get_engenheiro_id());
CREATE POLICY "laudos_update" ON public.laudos FOR UPDATE TO authenticated
  USING (engenheiro_id = public.get_engenheiro_id() OR public.is_admin());

-- Mídia: same as laudos
CREATE POLICY "midia_select" ON public.midia_laudo FOR SELECT TO authenticated
  USING (
    laudo_id IN (SELECT id FROM public.laudos WHERE engenheiro_id = public.get_engenheiro_id())
    OR public.is_admin()
    OR laudo_id IN (SELECT l.id FROM public.laudos l JOIN public.solicitacoes_laudo s ON l.solicitacao_id = s.id WHERE s.produtor_id = public.get_produtor_id())
  );
CREATE POLICY "midia_insert" ON public.midia_laudo FOR INSERT TO authenticated
  WITH CHECK (laudo_id IN (SELECT id FROM public.laudos WHERE engenheiro_id = public.get_engenheiro_id()));
CREATE POLICY "midia_delete" ON public.midia_laudo FOR DELETE TO authenticated
  USING (laudo_id IN (SELECT id FROM public.laudos WHERE engenheiro_id = public.get_engenheiro_id()) OR public.is_admin());

-- Assinatura: same as laudos
CREATE POLICY "assinatura_select" ON public.assinatura_laudo FOR SELECT TO authenticated
  USING (
    engenheiro_id = public.get_engenheiro_id()
    OR public.is_admin()
    OR laudo_id IN (SELECT l.id FROM public.laudos l JOIN public.solicitacoes_laudo s ON l.solicitacao_id = s.id WHERE s.produtor_id = public.get_produtor_id())
  );
CREATE POLICY "assinatura_insert" ON public.assinatura_laudo FOR INSERT TO authenticated
  WITH CHECK (engenheiro_id = public.get_engenheiro_id());

-- Pagamentos: engenheiro pode ver os próprios, admin vê/edita todos
CREATE POLICY "pagamentos_select" ON public.pagamentos_engenheiro FOR SELECT TO authenticated
  USING (engenheiro_id = public.get_engenheiro_id() OR public.is_admin());
CREATE POLICY "pagamentos_insert" ON public.pagamentos_engenheiro FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "pagamentos_update" ON public.pagamentos_engenheiro FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Configurações: admin only
CREATE POLICY "config_select" ON public.configuracoes_plataforma FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "config_update" ON public.configuracoes_plataforma FOR UPDATE TO authenticated USING (public.is_admin());

-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('laudo-media', 'laudo-media', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('laudo-pdfs', 'laudo-pdfs', false);

-- Storage policies for laudo-media
CREATE POLICY "media_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'laudo-media');
CREATE POLICY "media_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'laudo-media');
CREATE POLICY "media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'laudo-media');

-- Storage policies for laudo-pdfs
CREATE POLICY "pdfs_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'laudo-pdfs');
CREATE POLICY "pdfs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'laudo-pdfs');
