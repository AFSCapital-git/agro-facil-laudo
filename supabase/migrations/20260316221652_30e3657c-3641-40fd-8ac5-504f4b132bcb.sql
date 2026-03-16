
-- =============================================
-- INPUT VALIDATION: CHECK constraints & text limits
-- =============================================

-- Chat messages: limit text length
ALTER TABLE public.chat_mensagens ADD CONSTRAINT chat_mensagem_length
  CHECK (length(mensagem) <= 5000);

-- Propriedades: reasonable area bounds
ALTER TABLE public.propriedades ADD CONSTRAINT prop_area_range
  CHECK (area_total_ha >= 0.01 AND area_total_ha <= 1000000);

-- Profiles: text length limits
ALTER TABLE public.profiles ADD CONSTRAINT prof_nome_length
  CHECK (length(nome) <= 200);
ALTER TABLE public.profiles ADD CONSTRAINT prof_email_length
  CHECK (length(email) <= 255);
ALTER TABLE public.profiles ADD CONSTRAINT prof_telefone_length
  CHECK (telefone IS NULL OR length(telefone) <= 30);

-- Engenheiros: text limits
ALTER TABLE public.engenheiros ADD CONSTRAINT eng_crea_length
  CHECK (length(crea) <= 50);
ALTER TABLE public.engenheiros ADD CONSTRAINT eng_licenca_length
  CHECK (length(numero_licenca) <= 50);

-- Produtores: CPF/CNPJ limit
ALTER TABLE public.produtores ADD CONSTRAINT prod_cpf_length
  CHECK (length(cpf_cnpj) <= 20);

-- Laudos: text field limits
ALTER TABLE public.laudos ADD CONSTRAINT laudo_text_limits
  CHECK (
    (situacao_cultura IS NULL OR length(situacao_cultura) <= 5000) AND
    (tipo_solo IS NULL OR length(tipo_solo) <= 1000) AND
    (historico_produtividade IS NULL OR length(historico_produtividade) <= 5000) AND
    (disponibilidade_hidrica IS NULL OR length(disponibilidade_hidrica) <= 2000) AND
    (riscos_identificados IS NULL OR length(riscos_identificados) <= 5000) AND
    (garantias_observadas IS NULL OR length(garantias_observadas) <= 5000) AND
    (recomendacoes_tecnicas IS NULL OR length(recomendacoes_tecnicas) <= 5000) AND
    (resumo_viabilidade IS NULL OR length(resumo_viabilidade) <= 5000) AND
    (parecer_final IS NULL OR length(parecer_final) <= 5000) AND
    (observacoes_adicionais IS NULL OR length(observacoes_adicionais) <= 5000)
  );

-- Notificacoes: text limits
ALTER TABLE public.notificacoes ADD CONSTRAINT notif_titulo_length
  CHECK (length(titulo) <= 200);
ALTER TABLE public.notificacoes ADD CONSTRAINT notif_mensagem_length
  CHECK (length(mensagem) <= 2000);

-- sign-laudo edge function config
-- (handled via config.toml, not SQL)

-- Add explicit DELETE block on profiles
CREATE POLICY "profiles_no_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (false);

-- Add explicit INSERT block on profiles (only trigger can insert)
CREATE POLICY "profiles_no_direct_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (false);
