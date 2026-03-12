-- Add validity tracking columns to onboarding_documentos
ALTER TABLE public.onboarding_documentos
  ADD COLUMN IF NOT EXISTS data_validade date,
  ADD COLUMN IF NOT EXISTS data_emissao date,
  ADD COLUMN IF NOT EXISTS orgao_emissor text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dados_extraidos jsonb DEFAULT '{}'::jsonb;

-- Add validation fields to onboarding_compliance
ALTER TABLE public.onboarding_compliance
  ADD COLUMN IF NOT EXISTS fonte_validacao text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS dados_validacao jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ultima_verificacao_auto timestamp with time zone,
  ADD COLUMN IF NOT EXISTS proxima_verificacao timestamp with time zone,
  ADD COLUMN IF NOT EXISTS valido_ate date;

-- Add CNPJ validation cache to onboarding_empresas
ALTER TABLE public.onboarding_empresas
  ADD COLUMN IF NOT EXISTS dados_receita jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS situacao_cadastral text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ultima_consulta_cnpj timestamp with time zone;