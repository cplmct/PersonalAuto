/*
  # Add is_active to service_types

  ## Summary
  Adds an `is_active` boolean column to `service_types` to support hiding
  retired or disabled service templates without deleting them.

  ## Changes
  - `service_types`
    - New column `is_active` (boolean, NOT NULL, DEFAULT true)
    - All existing rows are set to true (active) so behaviour is unchanged
    - Index added for efficient filtering

  ## Notes
  - The hook layer will now filter `.eq('is_active', true)` in every query
    that feeds the UI or seeds new vehicle intervals.
  - Setting a row to is_active = false hides it from new vehicles and from
    the service catalogue UI without losing historical log data.
*/

ALTER TABLE public.service_types
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Backfill: all existing types are active
UPDATE public.service_types SET is_active = true WHERE is_active IS DISTINCT FROM true;

CREATE INDEX IF NOT EXISTS service_types_is_active_idx
  ON public.service_types (is_active)
  WHERE is_active = true;
