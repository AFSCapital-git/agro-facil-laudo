-- Fix: Make the self-signup insert policy PERMISSIVE so users can insert their own role
DROP POLICY IF EXISTS "roles_insert_own_on_signup" ON public.user_roles;
CREATE POLICY "roles_insert_own_on_signup"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Also make admin insert permissive
DROP POLICY IF EXISTS "roles_insert_admin" ON public.user_roles;
CREATE POLICY "roles_insert_admin"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Fix produtores insert policy to be permissive
DROP POLICY IF EXISTS "produtores_insert" ON public.produtores;
CREATE POLICY "produtores_insert"
  ON public.produtores
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Fix engenheiros insert policy to be permissive  
DROP POLICY IF EXISTS "engenheiros_insert" ON public.engenheiros;
CREATE POLICY "engenheiros_insert"
  ON public.engenheiros
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());