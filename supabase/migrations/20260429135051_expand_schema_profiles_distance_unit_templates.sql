/*
  # Expand schema: profiles distance_unit, preferred_vehicle_id, vehicles schema hardening, expanded service_types

  ## Summary
  This migration expands the automotive tracker schema to support:

  1. **profiles table**
     - Added `distance_unit` column ('mi' | 'km', default 'mi') — the user's preferred display unit
     - Added `preferred_vehicle_id` (uuid, nullable FK to vehicles) — optional override for the
       user's "active" vehicle, falling back to is_primary if null

  2. **vehicles table**
     - Added `odometer_km` integer column — canonical internal storage of odometer in kilometers
       (the app converts to/from the user's display unit; all interval math is km-based)
     - Added `is_active` boolean column (default true) for soft-deletes if not already present
     - Added `is_primary` boolean column (default false) if not already present
     - Added `odometer_unit` text column (default 'mi') if not already present
     - Added `engine`, `drivetrain`, `vin`, `image_url` nullable columns if not already present

  3. **service_types table**
     - Added `is_default` boolean column (default false) — marks the original 5 seeded types
     - Added `default_interval_km` integer nullable — canonical km-based default interval
     - Populated `default_interval_km` for existing rows (converting from miles: *1.60934)
     - Seeds 7 additional service types covering more vehicle needs
     - All new seeds carry `default_interval_km` values

  4. **vehicle_service_intervals table**
     - Added `interval_km` integer nullable — canonical km-based interval override
     - Populated existing rows from interval_miles

  5. **service_logs table**
     - Added `odometer_km_at_service` integer nullable — canonical km value at time of log
     - Populated from existing `odometer_at_service` (assumed miles for existing rows)

  ## Important notes
  - All new odometer and interval values are stored in km internally
  - The app reads `distance_unit` from the profile and converts for display only
  - Existing rows are migrated by assuming stored miles values; this is a best-effort migration
  - All operations are idempotent (IF NOT EXISTS / IF NOT EXISTS checks)
*/

-- ─── profiles: distance_unit + preferred_vehicle_id ──────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'distance_unit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN distance_unit text NOT NULL DEFAULT 'mi'
      CHECK (distance_unit IN ('mi', 'km'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_vehicle_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── vehicles: odometer_km + missing columns ─────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'odometer_unit') THEN
    ALTER TABLE vehicles ADD COLUMN odometer_unit text NOT NULL DEFAULT 'mi' CHECK (odometer_unit IN ('mi', 'km'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_primary') THEN
    ALTER TABLE vehicles ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_active') THEN
    ALTER TABLE vehicles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'engine') THEN
    ALTER TABLE vehicles ADD COLUMN engine text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'drivetrain') THEN
    ALTER TABLE vehicles ADD COLUMN drivetrain text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vin') THEN
    ALTER TABLE vehicles ADD COLUMN vin text DEFAULT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'image_url') THEN
    ALTER TABLE vehicles ADD COLUMN image_url text DEFAULT NULL;
  END IF;
END $$;

-- Canonical km odometer column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'odometer_km'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN odometer_km integer NOT NULL DEFAULT 0;
    -- Migrate existing rows: assume stored value is miles, convert to km
    UPDATE vehicles SET odometer_km = ROUND(current_odometer * 1.60934);
  END IF;
END $$;

-- ─── service_types: is_default + default_interval_km + new service types ─────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_types' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE service_types ADD COLUMN is_default boolean NOT NULL DEFAULT false;
    -- Mark the original 5 seeded types
    UPDATE service_types
    SET is_default = true
    WHERE name IN ('Oil Change', 'Brake Pads', 'Brake Rotors', 'Transmission Fluid', 'Differential Fluid');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_types' AND column_name = 'default_interval_km'
  ) THEN
    ALTER TABLE service_types ADD COLUMN default_interval_km integer;
    -- Populate from existing miles values
    UPDATE service_types
    SET default_interval_km = ROUND(default_interval_miles * 1.60934)
    WHERE default_interval_miles IS NOT NULL;
  END IF;
END $$;

-- Seed expanded service types (idempotent)
INSERT INTO service_types (name, default_interval_miles, default_interval_km, default_interval_months, icon_name, sort_order, is_default)
SELECT * FROM (VALUES
  ('Air Filter',            15000, 24140,  12, 'wind',     6,  false),
  ('Cabin Air Filter',      15000, 24140,  12, 'wind',     7,  false),
  ('Spark Plugs',           30000, 48280,  36, 'zap',      8,  false),
  ('Coolant Flush',         30000, 48280,  24, 'droplets', 9,  false),
  ('Power Steering Fluid',  50000, 80467,  48, 'droplets', 10, false),
  ('Fuel Filter',           30000, 48280,  24, 'droplets', 11, false),
  ('Battery',               50000, 80467,  48, 'zap',      12, false)
) AS t(name, default_interval_miles, default_interval_km, default_interval_months, icon_name, sort_order, is_default)
WHERE NOT EXISTS (SELECT 1 FROM service_types WHERE service_types.name = t.name);

-- Mark original defaults (idempotent update in case is_default was just added)
UPDATE service_types
SET is_default = true
WHERE name IN ('Oil Change', 'Brake Pads', 'Brake Rotors', 'Transmission Fluid', 'Differential Fluid')
  AND is_default = false;

-- ─── vehicle_service_intervals: interval_km ───────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_service_intervals' AND column_name = 'interval_km'
  ) THEN
    ALTER TABLE vehicle_service_intervals ADD COLUMN interval_km integer;
    -- Migrate existing rows
    UPDATE vehicle_service_intervals
    SET interval_km = ROUND(interval_miles * 1.60934)
    WHERE interval_miles IS NOT NULL;
  END IF;
END $$;

-- ─── service_logs: odometer_km_at_service ────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_logs' AND column_name = 'odometer_km_at_service'
  ) THEN
    ALTER TABLE service_logs ADD COLUMN odometer_km_at_service integer;
    -- Migrate existing rows: assume stored value is miles
    UPDATE service_logs
    SET odometer_km_at_service = ROUND(odometer_at_service * 1.60934);
  END IF;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_vehicle_id ON service_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_performed_at ON service_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_vehicle ON profiles(preferred_vehicle_id) WHERE preferred_vehicle_id IS NOT NULL;
