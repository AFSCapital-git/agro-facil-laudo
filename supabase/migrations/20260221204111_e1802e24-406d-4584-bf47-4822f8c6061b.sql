
-- =============================================
-- PHASE 1: Migrate status_mesa values
-- =============================================
UPDATE public.solicitacoes_laudo SET status_mesa = 'em_analise_mesa' WHERE status_mesa = 'em_analise';
UPDATE public.solicitacoes_laudo SET status_mesa = 'docs_pendentes_produtor' WHERE status_mesa = 'docs_pendente_eng';
UPDATE public.solicitacoes_laudo SET status_mesa = 'docs_em_validacao' WHERE status_mesa = 'docs_ok';
UPDATE public.solicitacoes_laudo SET status_mesa = 'elegivel' WHERE status_mesa = 'elegibilidade_ok';
UPDATE public.solicitacoes_laudo SET status_mesa = 'pronta_para_banco' WHERE status_mesa = 'aprovada';
UPDATE public.solicitacoes_laudo SET status_mesa = 'reprovada' WHERE status_mesa = 'rejeitada';

ALTER TABLE public.solicitacoes_laudo ADD CONSTRAINT solicitacoes_laudo_status_mesa_check 
CHECK (status_mesa = ANY (ARRAY['pendente','em_analise_mesa','docs_pendentes_produtor','docs_em_validacao','elegivel','reprovada','aguardando_laudo','pronta_para_banco']));

-- =============================================
-- PHASE 2: Migrate status_banco values
-- =============================================
UPDATE public.solicitacoes_laudo SET status_banco = 'enviado' WHERE status_banco = 'enviado_banco';
UPDATE public.solicitacoes_laudo SET status_banco = 'devolvido' WHERE status_banco = 'devolvido_banco';
UPDATE public.solicitacoes_laudo SET status_banco = 'aprovado' WHERE status_banco = 'aprovado_banco';

ALTER TABLE public.solicitacoes_laudo ADD CONSTRAINT solicitacoes_laudo_status_banco_check 
CHECK (status_banco = ANY (ARRAY['nao_enviado','enviado','devolvido','aprovado','reprovado']));

-- =============================================
-- PHASE 3: Fix invalid status_solicitacao data
-- =============================================
UPDATE public.solicitacoes_laudo SET status_solicitacao = 'em_andamento' WHERE status_solicitacao = 'aceita';

-- =============================================
-- PHASE 4: Update RLS for engineers with new status_mesa values
-- =============================================
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes_laudo;
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_laudo FOR SELECT
USING (
  (produtor_id = get_produtor_id()) OR 
  is_admin() OR 
  is_mesa_produtos() OR 
  (is_engenheiro() AND (
    ((status_solicitacao = 'aberta') AND (status_mesa IN ('aguardando_laudo', 'pronta_para_banco'))) OR 
    (id IN (SELECT get_engenheiro_laudo_solicitacao_ids())) OR 
    (engenheiro_atribuido_id = get_engenheiro_id())
  ))
);

-- =============================================
-- PHASE 5: Create solicitacao_eventos table
-- =============================================
CREATE TABLE public.solicitacao_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_laudo(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  campo_alterado TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  autor_id UUID,
  autor_tipo TEXT NOT NULL DEFAULT 'sistema',
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_solicitacao_eventos_solicitacao ON public.solicitacao_eventos(solicitacao_id);
CREATE INDEX idx_solicitacao_eventos_created ON public.solicitacao_eventos(created_at);

ALTER TABLE public.solicitacao_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_select" ON public.solicitacao_eventos FOR SELECT
USING (
  is_admin() OR is_mesa_produtos() OR
  (solicitacao_id IN (SELECT get_produtor_solicitacao_ids())) OR
  (is_engenheiro() AND (
    solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids()) OR
    solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())
  ))
);

-- Only SECURITY DEFINER triggers can insert (not API users)
CREATE POLICY "eventos_insert_block" ON public.solicitacao_eventos FOR INSERT
WITH CHECK (false);

-- =============================================
-- PHASE 6: Auto-logging triggers
-- =============================================
CREATE OR REPLACE FUNCTION public.log_solicitacao_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _autor_tipo TEXT := 'sistema';
  _uid UUID;
BEGIN
  _uid := auth.uid();
  IF _uid IS NOT NULL THEN
    IF has_role(_uid, 'admin') THEN _autor_tipo := 'admin';
    ELSIF has_role(_uid, 'mesa_produtos') THEN _autor_tipo := 'mesa';
    ELSIF has_role(_uid, 'engenheiro') THEN _autor_tipo := 'engenheiro';
    ELSIF has_role(_uid, 'produtor') THEN _autor_tipo := 'produtor';
    END IF;
  END IF;

  IF OLD.status_mesa IS DISTINCT FROM NEW.status_mesa THEN
    INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_anterior, valor_novo, autor_id, autor_tipo)
    VALUES (NEW.id, 'STATUS_MESA_MUDOU', 'status_mesa', OLD.status_mesa, NEW.status_mesa, _uid, _autor_tipo);
  END IF;

  IF OLD.status_solicitacao IS DISTINCT FROM NEW.status_solicitacao THEN
    INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_anterior, valor_novo, autor_id, autor_tipo)
    VALUES (NEW.id, 'STATUS_SOLICITACAO_MUDOU', 'status_solicitacao', OLD.status_solicitacao, NEW.status_solicitacao, _uid, _autor_tipo);
  END IF;

  IF OLD.status_banco IS DISTINCT FROM NEW.status_banco THEN
    INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_anterior, valor_novo, autor_id, autor_tipo)
    VALUES (NEW.id, 'STATUS_BANCO_MUDOU', 'status_banco', OLD.status_banco, NEW.status_banco, _uid, _autor_tipo);
  END IF;

  IF OLD.engenheiro_atribuido_id IS DISTINCT FROM NEW.engenheiro_atribuido_id AND NEW.engenheiro_atribuido_id IS NOT NULL THEN
    INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_anterior, valor_novo, autor_id, autor_tipo)
    VALUES (NEW.id, 'ENGENHEIRO_ATRIBUIDO', 'engenheiro_atribuido_id', OLD.engenheiro_atribuido_id::text, NEW.engenheiro_atribuido_id::text, _uid, _autor_tipo);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_solicitacao_status
AFTER UPDATE ON public.solicitacoes_laudo
FOR EACH ROW
EXECUTE FUNCTION public.log_solicitacao_status_change();

-- Log on creation
CREATE OR REPLACE FUNCTION public.log_solicitacao_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_novo, autor_id, autor_tipo)
  VALUES (NEW.id, 'SOLICITACAO_CRIADA', 'status_solicitacao', NEW.status_solicitacao, auth.uid(), 'produtor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_solicitacao_created
AFTER INSERT ON public.solicitacoes_laudo
FOR EACH ROW
EXECUTE FUNCTION public.log_solicitacao_created();

-- Log laudo status changes
CREATE OR REPLACE FUNCTION public.log_laudo_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status_laudo IS DISTINCT FROM NEW.status_laudo THEN
    INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_anterior, valor_novo, autor_id, autor_tipo)
    VALUES (NEW.solicitacao_id, 'STATUS_LAUDO_MUDOU', 'status_laudo', OLD.status_laudo, NEW.status_laudo, auth.uid(), 'engenheiro');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_laudo_status
AFTER UPDATE ON public.laudos
FOR EACH ROW
EXECUTE FUNCTION public.log_laudo_status_change();

-- Log laudo creation
CREATE OR REPLACE FUNCTION public.log_laudo_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO solicitacao_eventos (solicitacao_id, tipo_evento, campo_alterado, valor_novo, autor_id, autor_tipo)
  VALUES (NEW.solicitacao_id, 'LAUDO_CRIADO', 'status_laudo', NEW.status_laudo, auth.uid(), 'engenheiro');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_laudo_created
AFTER INSERT ON public.laudos
FOR EACH ROW
EXECUTE FUNCTION public.log_laudo_created();

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacao_eventos;
