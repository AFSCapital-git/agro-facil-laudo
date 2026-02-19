
-- 1. Add pricing fields to pronaf_produtos
ALTER TABLE public.pronaf_produtos
  ADD COLUMN valor_engenheiro numeric NOT NULL DEFAULT 0,
  ADD COLUMN tipo_valor_engenheiro text NOT NULL DEFAULT 'fixo';
-- tipo_valor_engenheiro: 'fixo' (valor absoluto R$) or 'percentual' (% do valor_solicitado)

-- 2. Link solicitações to pronaf_produtos and store calculated payment
ALTER TABLE public.solicitacoes_laudo
  ADD COLUMN pronaf_produto_id uuid REFERENCES public.pronaf_produtos(id),
  ADD COLUMN valor_pagamento_engenheiro numeric NOT NULL DEFAULT 0;

-- 3. Add visit deadline, geolocation start, and product confirmation to laudos
ALTER TABLE public.laudos
  ADD COLUMN data_limite_visita date,
  ADD COLUMN latitude_inicio_vistoria double precision,
  ADD COLUMN longitude_inicio_vistoria double precision,
  ADD COLUMN data_hora_inicio_vistoria timestamptz,
  ADD COLUMN pronaf_produto_confirmado_id uuid REFERENCES public.pronaf_produtos(id);
