
-- Allow mesa_produtos to SELECT produtores (needed for joins to get producer info)
DROP POLICY IF EXISTS "produtores_select" ON public.produtores;
CREATE POLICY "produtores_select" ON public.produtores
FOR SELECT USING (
  (user_id = auth.uid()) OR is_admin() OR is_mesa_produtos()
);
