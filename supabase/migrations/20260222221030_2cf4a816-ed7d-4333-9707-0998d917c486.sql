
-- Tabela de itens do orçamento de custeio
CREATE TABLE public.orcamento_custeio_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_laudo(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  unidade TEXT NOT NULL DEFAULT 'un',
  quantidade NUMERIC NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  categoria TEXT NOT NULL DEFAULT 'insumo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamento_custeio_itens ENABLE ROW LEVEL SECURITY;

-- Produtor pode CRUD nos itens das próprias solicitações
CREATE POLICY "orcamento_select" ON public.orcamento_custeio_itens
  FOR SELECT USING (
    solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
    OR is_admin()
    OR is_mesa_produtos()
    OR (is_engenheiro() AND (
      solicitacao_id IN (SELECT get_engenheiro_laudo_solicitacao_ids())
      OR solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE engenheiro_atribuido_id = get_engenheiro_id())
      OR solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id())
    ))
    OR (is_banco() AND solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE banco_parceiro_id = get_banco_parceiro_id()))
  );

CREATE POLICY "orcamento_insert" ON public.orcamento_custeio_itens
  FOR INSERT WITH CHECK (
    solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
    OR (is_engenheiro() AND solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id()))
  );

CREATE POLICY "orcamento_update" ON public.orcamento_custeio_itens
  FOR UPDATE USING (
    solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
    OR is_admin()
    OR is_mesa_produtos()
    OR (is_engenheiro() AND solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id()))
  );

CREATE POLICY "orcamento_delete" ON public.orcamento_custeio_itens
  FOR DELETE USING (
    solicitacao_id IN (SELECT get_produtor_solicitacao_ids())
    OR is_admin()
    OR (is_engenheiro() AND solicitacao_id IN (SELECT id FROM solicitacoes_laudo WHERE assistido = true AND engenheiro_assistente_id = get_engenheiro_id()))
  );

-- Trigger para updated_at
CREATE TRIGGER update_orcamento_custeio_itens_updated_at
  BEFORE UPDATE ON public.orcamento_custeio_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
