
-- Add bank workflow tracking columns to solicitacoes_laudo
ALTER TABLE public.solicitacoes_laudo
  ADD COLUMN IF NOT EXISTS status_banco text NOT NULL DEFAULT 'nao_enviado',
  ADD COLUMN IF NOT EXISTS data_envio_banco timestamp with time zone,
  ADD COLUMN IF NOT EXISTS data_retorno_banco timestamp with time zone,
  ADD COLUMN IF NOT EXISTS observacoes_banco text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo_valor_engenheiro_override text,
  ADD COLUMN IF NOT EXISTS valor_engenheiro_override numeric;
