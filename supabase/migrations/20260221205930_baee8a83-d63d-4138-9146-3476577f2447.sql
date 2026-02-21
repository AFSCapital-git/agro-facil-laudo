
-- 1. Drop RLS policies that depend on status_solicitacao FIRST
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes_laudo;
DROP POLICY IF EXISTS "solicitacoes_update" ON public.solicitacoes_laudo;

-- 2. Drop old status_solicitacao column
ALTER TABLE public.solicitacoes_laudo DROP COLUMN IF EXISTS status_solicitacao;

-- 3. Rename status_mesa → status_solicitacao
ALTER TABLE public.solicitacoes_laudo RENAME COLUMN status_mesa TO status_solicitacao;

-- 4. Drop old CHECK constraint, add new one
ALTER TABLE public.solicitacoes_laudo DROP CONSTRAINT IF EXISTS check_status_mesa;
ALTER TABLE public.solicitacoes_laudo ADD CONSTRAINT check_status_solicitacao 
  CHECK (status_solicitacao IN ('pendente', 'em_analise_mesa', 'docs_pendentes_produtor', 'docs_em_validacao', 'elegivel', 'reprovada', 'aguardando_laudo', 'pronta_para_banco'));

-- 5. Recreate RLS policies with new column name
CREATE POLICY "solicitacoes_select" ON public.solicitacoes_laudo
FOR SELECT USING (
  (produtor_id = get_produtor_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_engenheiro() AND (
    (status_solicitacao = ANY (ARRAY['aguardando_laudo'::text, 'pronta_para_banco'::text]))
    OR (id IN (SELECT get_engenheiro_laudo_solicitacao_ids()))
    OR (engenheiro_atribuido_id = get_engenheiro_id())
  ))
);

CREATE POLICY "solicitacoes_update" ON public.solicitacoes_laudo
FOR UPDATE USING (
  (produtor_id = get_produtor_id())
  OR is_admin()
  OR is_mesa_produtos()
  OR (is_engenheiro() AND (
    (id IN (SELECT get_engenheiro_laudo_solicitacao_ids()))
    OR (engenheiro_atribuido_id = get_engenheiro_id())
  ))
);

-- 6. Update existing events
UPDATE public.solicitacao_eventos 
SET tipo_evento = 'STATUS_SOLICITACAO_MUDOU', campo_alterado = 'status_solicitacao'
WHERE tipo_evento = 'STATUS_MESA_MUDOU';

DELETE FROM public.solicitacao_eventos 
WHERE tipo_evento = 'STATUS_SOLICITACAO_MUDOU' 
  AND valor_novo IN ('aberta', 'em_andamento', 'concluida', 'finalizada', 'ineligivel', 'aguardando_eng');

-- 7. Recreate trigger function
CREATE OR REPLACE FUNCTION public.log_solicitacao_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  perfil TEXT NOT NULL DEFAULT 'sistema',
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT USING (is_admin());

CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
FOR INSERT WITH CHECK (false);

-- Audit trigger for solicitacoes_laudo
CREATE OR REPLACE FUNCTION public.audit_solicitacao_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID;
  _perfil TEXT := 'sistema';
  _changes JSONB := '{}'::JSONB;
  _old_data JSONB := '{}'::JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NOT NULL THEN
    IF has_role(_uid, 'admin') THEN _perfil := 'admin';
    ELSIF has_role(_uid, 'mesa_produtos') THEN _perfil := 'mesa';
    ELSIF has_role(_uid, 'engenheiro') THEN _perfil := 'engenheiro';
    ELSIF has_role(_uid, 'produtor') THEN _perfil := 'produtor';
    END IF;
  END IF;

  IF OLD.status_solicitacao IS DISTINCT FROM NEW.status_solicitacao THEN
    _old_data := _old_data || jsonb_build_object('status_solicitacao', OLD.status_solicitacao);
    _changes := _changes || jsonb_build_object('status_solicitacao', NEW.status_solicitacao);
  END IF;
  IF OLD.status_banco IS DISTINCT FROM NEW.status_banco THEN
    _old_data := _old_data || jsonb_build_object('status_banco', OLD.status_banco);
    _changes := _changes || jsonb_build_object('status_banco', NEW.status_banco);
  END IF;
  IF OLD.engenheiro_atribuido_id IS DISTINCT FROM NEW.engenheiro_atribuido_id THEN
    _old_data := _old_data || jsonb_build_object('engenheiro_atribuido_id', OLD.engenheiro_atribuido_id);
    _changes := _changes || jsonb_build_object('engenheiro_atribuido_id', NEW.engenheiro_atribuido_id);
  END IF;

  IF _changes != '{}'::JSONB THEN
    INSERT INTO audit_logs (user_id, perfil, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (_uid, _perfil, 'ATUALIZAR_SOLICITACAO', 'solicitacao', NEW.id::text, _old_data, _changes);
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_audit_solicitacao
AFTER UPDATE ON public.solicitacoes_laudo
FOR EACH ROW EXECUTE FUNCTION public.audit_solicitacao_changes();

-- Audit trigger for laudos
CREATE OR REPLACE FUNCTION public.audit_laudo_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID;
  _perfil TEXT := 'sistema';
BEGIN
  _uid := auth.uid();
  IF _uid IS NOT NULL THEN
    IF has_role(_uid, 'admin') THEN _perfil := 'admin';
    ELSIF has_role(_uid, 'engenheiro') THEN _perfil := 'engenheiro';
    END IF;
  END IF;

  IF OLD.status_laudo IS DISTINCT FROM NEW.status_laudo THEN
    INSERT INTO audit_logs (user_id, perfil, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (_uid, _perfil, 'ATUALIZAR_LAUDO', 'laudo', NEW.id::text,
      jsonb_build_object('status_laudo', OLD.status_laudo),
      jsonb_build_object('status_laudo', NEW.status_laudo));
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_audit_laudo
AFTER UPDATE ON public.laudos
FOR EACH ROW EXECUTE FUNCTION public.audit_laudo_changes();

-- 9. LOGIN LOGS TABLE
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_logs_select" ON public.login_logs
FOR SELECT USING (is_admin() OR user_id = auth.uid());

CREATE POLICY "login_logs_insert" ON public.login_logs
FOR INSERT WITH CHECK (user_id = auth.uid());
