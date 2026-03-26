
-- Auto-promote the very first user who signs up to admin
-- (subsequent users get viewer by default via the trigger)
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    -- This is the first ever user, make them admin
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promote_first_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.promote_first_user_to_admin();
