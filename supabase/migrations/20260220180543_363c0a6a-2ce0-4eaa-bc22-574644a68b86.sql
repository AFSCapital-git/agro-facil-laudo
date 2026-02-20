
-- Allow mesa_produtos to SELECT propriedades (needed for joins)
DROP POLICY IF EXISTS "propriedades_select" ON public.propriedades;
CREATE POLICY "propriedades_select" ON public.propriedades
FOR SELECT USING (
  (produtor_id = get_produtor_id()) OR is_admin() OR is_mesa_produtos()
);

-- Allow mesa_produtos to SELECT laudos (needed for envios-banco)
DROP POLICY IF EXISTS "laudos_select" ON public.laudos;
CREATE POLICY "laudos_select" ON public.laudos
FOR SELECT USING (
  (engenheiro_id = get_engenheiro_id()) OR is_admin() OR is_mesa_produtos()
  OR (is_produtor() AND (solicitacao_id IN (SELECT get_produtor_solicitacao_ids())))
);

-- Allow mesa_produtos to SELECT engenheiros (needed to see assigned engineer info)
DROP POLICY IF EXISTS "engenheiros_select" ON public.engenheiros;
CREATE POLICY "engenheiros_select" ON public.engenheiros
FOR SELECT USING (
  (user_id = auth.uid()) OR is_admin() OR is_mesa_produtos()
);
