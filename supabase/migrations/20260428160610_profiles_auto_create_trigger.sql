/*
  # Profile auto-creation trigger

  ## Summary
  Creates a PostgreSQL trigger that automatically inserts a row into
  public.profiles whenever a new user is created in auth.users.

  This means the app never needs to manually upsert a profile after
  sign-up — the database guarantees it exists before the client session
  is returned.

  ## Details
  - Function: handle_new_user() — runs SECURITY DEFINER so it can write
    to public.profiles on behalf of the new user even before their JWT
    is valid for RLS.
  - Trigger: on_auth_user_created — fires AFTER INSERT on auth.users,
    once per row.
  - Safe to apply multiple times: uses CREATE OR REPLACE + DROP/CREATE.
  - display_name is seeded from raw_user_meta_data->full_name if present
    (populated by Google OAuth), otherwise left as empty string.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate so the trigger is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
