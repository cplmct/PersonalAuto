/*
  # Add set_primary_vehicle RPC

  ## Summary
  Replaces the fragile two-step client update (clear all → set one) with a
  single atomic database function. This guarantees exactly one primary vehicle
  per user and eliminates the window where no vehicle is primary if the second
  client call fails.

  ## New function
  - `set_primary_vehicle(vehicle_id uuid)` — security definer function that:
    1. Verifies the calling user owns the vehicle (throws if not)
    2. Clears is_primary on all the user's active vehicles
    3. Sets is_primary = true on the target vehicle
    Both writes happen in one transaction; the partial-update failure window
    is impossible.

  ## Security
  - SECURITY DEFINER with a fixed search_path prevents privilege escalation
  - Ownership check ensures users cannot promote another user's vehicle
*/

CREATE OR REPLACE FUNCTION public.set_primary_vehicle(vehicle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Resolve the calling user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = vehicle_id
      AND v.user_id = v_user_id
      AND v.is_active = true
  ) THEN
    RAISE EXCEPTION 'vehicle not found or not owned by user';
  END IF;

  -- Atomically clear and set in one transaction
  UPDATE public.vehicles
  SET is_primary = (id = vehicle_id),
      updated_at = now()
  WHERE user_id = v_user_id
    AND is_active = true;
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.set_primary_vehicle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_primary_vehicle(uuid) TO authenticated;
