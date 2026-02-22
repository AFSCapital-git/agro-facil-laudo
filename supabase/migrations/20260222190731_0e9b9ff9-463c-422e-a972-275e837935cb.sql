
-- Adicionar campos de licença/registro profissional na tabela engenheiros
ALTER TABLE public.engenheiros
  ADD COLUMN IF NOT EXISTS tipo_licenca text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS numero_licenca text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS ja_engenheiro boolean DEFAULT false NOT NULL;
