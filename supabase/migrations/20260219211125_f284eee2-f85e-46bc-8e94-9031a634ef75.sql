
-- Permitir que novos usuários insiram seu próprio role no signup
CREATE POLICY "roles_insert_own_on_signup" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Função para atribuir role via signup (chamada do frontend)
-- Isso é seguro pois o user só pode inserir SEU PRÓPRIO role
