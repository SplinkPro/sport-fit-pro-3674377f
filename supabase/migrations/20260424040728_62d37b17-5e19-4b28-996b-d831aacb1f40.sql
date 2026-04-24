-- Drop the overly broad ALL policy and replace with explicit per-command policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admins can view all roles (for the admin panel)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins may insert new role rows. The handle_new_user trigger runs
-- as SECURITY DEFINER so it bypasses this policy when seeding the
-- 'viewer' default role on signup.
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins may update existing role rows
CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins may delete role rows
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));