
-- Tabela de membros da rede (PF ou PJ) vinculados a cada empresa do onboarding
CREATE TABLE public.onboarding_rede_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.onboarding_empresas(id) ON DELETE CASCADE,
  -- Tipo de pessoa e segmento
  tipo_pessoa text NOT NULL DEFAULT 'pj' CHECK (tipo_pessoa IN ('pf', 'pj')),
  segmento text NOT NULL DEFAULT 'agrobanker' CHECK (segmento IN (
    'agrobanker', 'engenheiro', 'projetista', 'revenda', 'sindicato', 
    'associacao', 'cooperativa', 'consultoria', 'corretora', 'outro'
  )),
  segmento_outro text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'rejeitado', 'ativo', 'inativo', 'bloqueado')),
  
  -- Dados PJ
  cnpj text DEFAULT '',
  razao_social text DEFAULT '',
  nome_fantasia text DEFAULT '',
  inscricao_estadual text DEFAULT '',
  
  -- Dados PF / Responsável
  nome_completo text NOT NULL DEFAULT '',
  cpf text DEFAULT '',
  rg text DEFAULT '',
  rg_orgao_emissor text DEFAULT '',
  rg_uf text DEFAULT '',
  nome_mae text DEFAULT '',
  nome_pai text DEFAULT '',
  genero text DEFAULT '',
  nacionalidade text DEFAULT 'brasileira',
  data_nascimento date,
  estado_civil text DEFAULT '',
  regime_casamento text DEFAULT '',
  cpf_conjuge text DEFAULT '',
  nome_conjuge text DEFAULT '',
  capacidade_civil text DEFAULT '',
  grau_instrucao text DEFAULT '',
  pessoa_exposta_politicamente boolean DEFAULT false,
  
  -- Tipo de documento de identificação
  tipo_documento text DEFAULT 'rg' CHECK (tipo_documento IN ('rg', 'cnh', 'carteira_classe', 'carteira_militar', 'passaporte', 'ctps', 'identidade_indigena', 'outro')),
  numero_documento text DEFAULT '',
  documento_uf text DEFAULT '',
  documento_cidade text DEFAULT '',
  documento_orgao_emissor text DEFAULT '',
  documento_numero_registro text DEFAULT '',
  documento_numero_via text DEFAULT '',
  documento_unidade_funai text DEFAULT '',
  documento_data_emissao date,
  
  -- Localização
  tipo_endereco text DEFAULT 'residencial',
  comprovante_endereco text DEFAULT '',
  tempo_utilizacao_meses integer DEFAULT 0,
  cep text DEFAULT '',
  uf text DEFAULT '',
  cidade text DEFAULT '',
  bairro text DEFAULT '',
  logradouro text DEFAULT '',
  perimetro text DEFAULT '',
  numero text DEFAULT '',
  complemento text DEFAULT '',
  zona_urbana boolean DEFAULT false,
  endereco_correspondencia boolean DEFAULT false,
  local_correio boolean DEFAULT false,
  imovel_proprio boolean DEFAULT false,
  tipo_imovel text DEFAULT '',
  
  -- Endereço de correspondência (quando diferente)
  corresp_cep text DEFAULT '',
  corresp_uf text DEFAULT '',
  corresp_cidade text DEFAULT '',
  corresp_bairro text DEFAULT '',
  corresp_logradouro text DEFAULT '',
  corresp_perimetro text DEFAULT '',
  corresp_numero text DEFAULT '',
  corresp_complemento text DEFAULT '',
  corresp_imovel_proprio boolean DEFAULT false,
  corresp_tipo_imovel text DEFAULT '',
  
  -- Contato
  ddd text DEFAULT '',
  telefone text DEFAULT '',
  email text DEFAULT '',
  
  -- Dados profissionais (engenheiro/projetista)
  crea text DEFAULT '',
  tipo_licenca text DEFAULT '',
  numero_licenca text DEFAULT '',
  area_atuacao text DEFAULT '',
  
  -- Vinculação ao sistema (user criado)
  user_id uuid,
  user_criado boolean DEFAULT false,
  
  -- Dados da Receita (cache da consulta CNPJ)
  dados_receita jsonb DEFAULT '{}'::jsonb,
  situacao_cadastral text DEFAULT '',
  
  -- Auditoria
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_rede_membros_empresa ON public.onboarding_rede_membros(empresa_id);
CREATE INDEX idx_rede_membros_segmento ON public.onboarding_rede_membros(segmento);
CREATE INDEX idx_rede_membros_status ON public.onboarding_rede_membros(status);

-- RLS
ALTER TABLE public.onboarding_rede_membros ENABLE ROW LEVEL SECURITY;

-- Subestabelecido pode gerenciar membros da própria empresa
CREATE POLICY "rm_select" ON public.onboarding_rede_membros
  FOR SELECT TO authenticated
  USING (
    is_admin() OR is_coban_master() 
    OR (is_subestabelecido() AND (
      empresa_id = get_onboarding_empresa_id() 
      OR empresa_id IN (SELECT id FROM onboarding_empresas WHERE parent_id = get_onboarding_empresa_id())
    ))
  );

CREATE POLICY "rm_insert" ON public.onboarding_rede_membros
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR is_coban_master() 
    OR (is_subestabelecido() AND (
      empresa_id = get_onboarding_empresa_id() 
      OR empresa_id IN (SELECT id FROM onboarding_empresas WHERE parent_id = get_onboarding_empresa_id())
    ))
  );

CREATE POLICY "rm_update" ON public.onboarding_rede_membros
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR is_coban_master() 
    OR (is_subestabelecido() AND (
      empresa_id = get_onboarding_empresa_id() 
      OR empresa_id IN (SELECT id FROM onboarding_empresas WHERE parent_id = get_onboarding_empresa_id())
    ))
  );

CREATE POLICY "rm_delete" ON public.onboarding_rede_membros
  FOR DELETE TO authenticated
  USING (is_admin() OR is_coban_master());
