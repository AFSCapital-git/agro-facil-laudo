
-- Tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'info', -- info, alerta, sucesso, erro
  lida BOOLEAN NOT NULL DEFAULT false,
  link TEXT DEFAULT NULL, -- rota para navegar ao clicar
  entidade TEXT DEFAULT NULL, -- solicitacao, laudo, pagamento
  entidade_id UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes (user_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes (user_id, lida) WHERE lida = false;

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Usuário só vê suas próprias notificações
CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT USING (user_id = auth.uid());

-- Usuário pode marcar como lida
CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Apenas sistema insere (via triggers SECURITY DEFINER)
CREATE POLICY "notificacoes_insert_system" ON public.notificacoes
  FOR INSERT WITH CHECK (false);

-- Usuário pode deletar suas notificações
CREATE POLICY "notificacoes_delete" ON public.notificacoes
  FOR DELETE USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;

-- =====================================================
-- Função auxiliar para criar notificação (SECURITY DEFINER)
-- =====================================================
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  _user_id UUID,
  _titulo TEXT,
  _mensagem TEXT DEFAULT '',
  _tipo TEXT DEFAULT 'info',
  _link TEXT DEFAULT NULL,
  _entidade TEXT DEFAULT NULL,
  _entidade_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link, entidade, entidade_id)
  VALUES (_user_id, _titulo, _mensagem, _tipo, _link, _entidade, _entidade_id);
END;
$$;

-- =====================================================
-- Trigger: notificar mudança de status da solicitação
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_solicitacao_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _produtor_user_id UUID;
  _eng_user_id UUID;
  _status_label TEXT;
  _link TEXT;
BEGIN
  -- Só dispara se status mudou
  IF OLD.status_solicitacao IS NOT DISTINCT FROM NEW.status_solicitacao THEN
    RETURN NEW;
  END IF;

  _link := '/solicitacoes';

  -- Mapear status para label
  _status_label := CASE NEW.status_solicitacao
    WHEN 'pendente' THEN 'Pendente'
    WHEN 'em_analise' THEN 'Em Análise'
    WHEN 'aguardando_laudo' THEN 'Aguardando Laudo'
    WHEN 'pronta_para_banco' THEN 'Pronta para Banco'
    WHEN 'enviada_banco' THEN 'Enviada ao Banco'
    WHEN 'aprovada' THEN 'Aprovada'
    WHEN 'recusada' THEN 'Recusada'
    WHEN 'cancelada' THEN 'Cancelada'
    ELSE NEW.status_solicitacao
  END;

  -- Notificar produtor
  SELECT user_id INTO _produtor_user_id FROM public.produtores WHERE id = NEW.produtor_id;
  IF _produtor_user_id IS NOT NULL THEN
    PERFORM public.criar_notificacao(
      _produtor_user_id,
      'Solicitação atualizada',
      'Sua solicitação mudou para: ' || _status_label,
      'info',
      _link,
      'solicitacao',
      NEW.id
    );
  END IF;

  -- Notificar engenheiro atribuído (se houver)
  IF NEW.engenheiro_atribuido_id IS NOT NULL THEN
    SELECT user_id INTO _eng_user_id FROM public.engenheiros WHERE id = NEW.engenheiro_atribuido_id;
    IF _eng_user_id IS NOT NULL AND _eng_user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000') THEN
      PERFORM public.criar_notificacao(
        _eng_user_id,
        'Solicitação atualizada',
        'Solicitação mudou para: ' || _status_label,
        'info',
        '/demandas',
        'solicitacao',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_solicitacao_status
AFTER UPDATE ON public.solicitacoes_laudo
FOR EACH ROW
EXECUTE FUNCTION public.notify_solicitacao_status_change();

-- =====================================================
-- Trigger: notificar engenheiro quando atribuído
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_engenheiro_atribuido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _eng_user_id UUID;
BEGIN
  IF OLD.engenheiro_atribuido_id IS DISTINCT FROM NEW.engenheiro_atribuido_id 
     AND NEW.engenheiro_atribuido_id IS NOT NULL THEN
    SELECT user_id INTO _eng_user_id FROM public.engenheiros WHERE id = NEW.engenheiro_atribuido_id;
    IF _eng_user_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        _eng_user_id,
        'Nova demanda atribuída',
        'Você foi atribuído a uma nova solicitação de laudo.',
        'alerta',
        '/demandas',
        'solicitacao',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_engenheiro_atribuido
AFTER UPDATE ON public.solicitacoes_laudo
FOR EACH ROW
EXECUTE FUNCTION public.notify_engenheiro_atribuido();

-- =====================================================
-- Trigger: notificar produtor quando laudo finalizado
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_laudo_finalizado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _produtor_user_id UUID;
  _sol RECORD;
BEGIN
  IF OLD.status_laudo IS DISTINCT FROM NEW.status_laudo AND NEW.status_laudo = 'finalizado' THEN
    SELECT s.id, p.user_id INTO _sol
    FROM public.solicitacoes_laudo s
    JOIN public.produtores p ON p.id = s.produtor_id
    WHERE s.id = NEW.solicitacao_id;

    IF _sol.user_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        _sol.user_id,
        'Laudo finalizado!',
        'Seu laudo foi finalizado e já está disponível para download.',
        'sucesso',
        '/meus-laudos',
        'laudo',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_laudo_finalizado
AFTER UPDATE ON public.laudos
FOR EACH ROW
EXECUTE FUNCTION public.notify_laudo_finalizado();

-- =====================================================
-- Trigger: notificar engenheiro sobre pagamento
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_pagamento_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _eng_user_id UUID;
BEGIN
  IF OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento AND NEW.status_pagamento = 'pago' THEN
    SELECT user_id INTO _eng_user_id FROM public.engenheiros WHERE id = NEW.engenheiro_id;
    IF _eng_user_id IS NOT NULL THEN
      PERFORM public.criar_notificacao(
        _eng_user_id,
        'Pagamento confirmado!',
        'Seu pagamento de R$ ' || NEW.valor_bruto::TEXT || ' foi confirmado.',
        'sucesso',
        '/pagamentos',
        'pagamento',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_pagamento_status
AFTER UPDATE ON public.pagamentos_engenheiro
FOR EACH ROW
EXECUTE FUNCTION public.notify_pagamento_status();
