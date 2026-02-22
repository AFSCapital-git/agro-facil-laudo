
ALTER TABLE public.propriedades
  ADD COLUMN municipio text NOT NULL DEFAULT '',
  ADD COLUMN uf character(2) NOT NULL DEFAULT '',
  ADD COLUMN matricula_imovel text DEFAULT '',
  ADD COLUMN numero_ccir text DEFAULT '',
  ADD COLUMN numero_itr text DEFAULT '',
  ADD COLUMN tipo_posse text NOT NULL DEFAULT 'propria',
  ADD COLUMN area_reserva_legal_ha numeric DEFAULT 0,
  ADD COLUMN area_app_ha numeric DEFAULT 0,
  ADD COLUMN fonte_agua text DEFAULT '',
  ADD COLUMN tipo_solo text DEFAULT '';
