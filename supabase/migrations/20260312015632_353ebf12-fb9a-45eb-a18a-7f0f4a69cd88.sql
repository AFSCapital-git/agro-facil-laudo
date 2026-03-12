
-- Create onboarding_rm table
CREATE TABLE public.onboarding_rm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.onboarding_empresas(id) ON DELETE CASCADE,
  user_id uuid,
  nome text NOT NULL DEFAULT '',
  cpf text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text DEFAULT '',
  cargo text DEFAULT 'RM Comercial',
  status text NOT NULL DEFAULT 'ativo',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_rm ENABLE ROW LEVEL SECURITY;

-- Add rm_id to onboarding_empresas
ALTER TABLE public.onboarding_empresas ADD COLUMN IF NOT EXISTS rm_id uuid REFERENCES public.onboarding_rm(id);

-- Document uploads for network members
CREATE TABLE public.onboarding_rede_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id uuid NOT NULL REFERENCES public.onboarding_rede_membros(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL DEFAULT '',
  nome_arquivo text NOT NULL DEFAULT '',
  caminho_arquivo text NOT NULL DEFAULT '',
  dados_extraidos jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'enviado',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_rede_documentos ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_rm_updated_at BEFORE UPDATE ON public.onboarding_rm
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
