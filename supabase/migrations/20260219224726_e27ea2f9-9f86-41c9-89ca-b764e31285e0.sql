
-- Tabela de produtos/modalidades PRONAF
CREATE TABLE public.pronaf_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  finalidade text NOT NULL DEFAULT 'investimento', -- investimento, custeio, capital_de_giro
  grupo_alvo text NOT NULL DEFAULT '',
  o_que_financia text NOT NULL DEFAULT '',
  limite_valor text NOT NULL DEFAULT '',
  juros text NOT NULL DEFAULT '',
  prazo_reembolso text NOT NULL DEFAULT '',
  carencia text NOT NULL DEFAULT '',
  bonus_adimplencia text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de documentações exigidas por produto
CREATE TABLE public.pronaf_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.pronaf_produtos(id) ON DELETE CASCADE,
  nome_documento text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  obrigatorio boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pronaf_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronaf_documentos ENABLE ROW LEVEL SECURITY;

-- Todos podem ler produtos e docs (necessário para o fluxo de solicitação)
CREATE POLICY "pronaf_produtos_select" ON public.pronaf_produtos FOR SELECT USING (true);
CREATE POLICY "pronaf_documentos_select" ON public.pronaf_documentos FOR SELECT USING (true);

-- Apenas admin pode inserir/atualizar/deletar
CREATE POLICY "pronaf_produtos_insert" ON public.pronaf_produtos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "pronaf_produtos_update" ON public.pronaf_produtos FOR UPDATE USING (is_admin());
CREATE POLICY "pronaf_produtos_delete" ON public.pronaf_produtos FOR DELETE USING (is_admin());

CREATE POLICY "pronaf_documentos_insert" ON public.pronaf_documentos FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "pronaf_documentos_update" ON public.pronaf_documentos FOR UPDATE USING (is_admin());
CREATE POLICY "pronaf_documentos_delete" ON public.pronaf_documentos FOR DELETE USING (is_admin());

-- Trigger updated_at
CREATE TRIGGER update_pronaf_produtos_updated_at
BEFORE UPDATE ON public.pronaf_produtos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
