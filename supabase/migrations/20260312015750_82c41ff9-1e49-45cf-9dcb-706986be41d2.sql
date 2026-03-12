
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_rm_comercial()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'rm_comercial') $$;

CREATE OR REPLACE FUNCTION public.get_onboarding_rm_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.onboarding_rm WHERE user_id = auth.uid() LIMIT 1 $$;

-- RLS for onboarding_rm
CREATE POLICY "orm_select" ON public.onboarding_rm FOR SELECT TO authenticated
USING (is_admin() OR is_coban_master() OR (is_rm_comercial() AND user_id = auth.uid()));
CREATE POLICY "orm_insert" ON public.onboarding_rm FOR INSERT TO authenticated
WITH CHECK (is_admin() OR is_coban_master());
CREATE POLICY "orm_update" ON public.onboarding_rm FOR UPDATE TO authenticated
USING (is_admin() OR is_coban_master());
CREATE POLICY "orm_delete" ON public.onboarding_rm FOR DELETE TO authenticated
USING (is_admin() OR is_coban_master());

-- RLS for rede_documentos
CREATE POLICY "ord_select" ON public.onboarding_rede_documentos FOR SELECT TO authenticated
USING (is_admin() OR is_coban_master() OR is_subestabelecido() OR is_rm_comercial());
CREATE POLICY "ord_insert" ON public.onboarding_rede_documentos FOR INSERT TO authenticated
WITH CHECK (is_admin() OR is_coban_master() OR is_subestabelecido());
CREATE POLICY "ord_delete" ON public.onboarding_rede_documentos FOR DELETE TO authenticated
USING (is_admin() OR is_coban_master());

-- Update onboarding_empresas SELECT
DROP POLICY IF EXISTS "oe_select" ON public.onboarding_empresas;
CREATE POLICY "oe_select" ON public.onboarding_empresas FOR SELECT TO authenticated
USING (
  is_admin() OR is_coban_master() 
  OR (is_subestabelecido() AND (id = get_onboarding_empresa_id() OR parent_id = get_onboarding_empresa_id()))
  OR (is_rm_comercial() AND rm_id = get_onboarding_rm_id())
);

-- Update onboarding_rede_membros SELECT
DROP POLICY IF EXISTS "rede_select" ON public.onboarding_rede_membros;
CREATE POLICY "rede_select" ON public.onboarding_rede_membros FOR SELECT TO authenticated
USING (
  is_admin() OR is_coban_master()
  OR (is_subestabelecido() AND empresa_id = get_onboarding_empresa_id())
  OR (is_rm_comercial() AND empresa_id IN (
    SELECT id FROM public.onboarding_empresas WHERE rm_id = get_onboarding_rm_id()
  ))
);
