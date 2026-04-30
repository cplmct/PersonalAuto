
/*
  # Automotive Maintenance Tracker - Initial Schema (idempotent)

  Creates vehicles, service_types, vehicle_service_intervals, and service_logs tables
  with full RLS policies and seeds standard service types.
*/

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  year integer NOT NULL DEFAULT 2020,
  nickname text DEFAULT '',
  current_odometer integer NOT NULL DEFAULT 0,
  color text DEFAULT '#4A6FA5',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can view own vehicles') THEN
    CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can insert own vehicles') THEN
    CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can update own vehicles') THEN
    CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can delete own vehicles') THEN
    CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service types reference table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_interval_miles integer,
  default_interval_months integer,
  icon_name text DEFAULT 'wrench',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_types' AND policyname = 'Service types are publicly readable') THEN
    CREATE POLICY "Service types are publicly readable" ON service_types FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Seed standard service types
INSERT INTO service_types (name, default_interval_miles, default_interval_months, icon_name, sort_order)
SELECT * FROM (VALUES
  ('Oil Change', 5000, 6, 'oil-can', 1),
  ('Brake Pads', 30000, 36, 'disc', 2),
  ('Brake Rotors', 60000, 60, 'disc', 3),
  ('Transmission Fluid', 30000, 36, 'droplets', 4),
  ('Differential Fluid', 30000, 36, 'droplets', 5)
) AS t(name, default_interval_miles, default_interval_months, icon_name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM service_types WHERE service_types.name = t.name);

-- Vehicle service interval overrides
CREATE TABLE IF NOT EXISTS vehicle_service_intervals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type_id uuid NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  interval_miles integer,
  interval_months integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vehicle_id, service_type_id)
);

ALTER TABLE vehicle_service_intervals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_intervals' AND policyname = 'Users can view own vehicle intervals') THEN
    CREATE POLICY "Users can view own vehicle intervals" ON vehicle_service_intervals FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_service_intervals.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_intervals' AND policyname = 'Users can insert own vehicle intervals') THEN
    CREATE POLICY "Users can insert own vehicle intervals" ON vehicle_service_intervals FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_service_intervals.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_intervals' AND policyname = 'Users can update own vehicle intervals') THEN
    CREATE POLICY "Users can update own vehicle intervals" ON vehicle_service_intervals FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_service_intervals.vehicle_id AND vehicles.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_service_intervals.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_intervals' AND policyname = 'Users can delete own vehicle intervals') THEN
    CREATE POLICY "Users can delete own vehicle intervals" ON vehicle_service_intervals FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_service_intervals.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
END $$;

-- Service logs
CREATE TABLE IF NOT EXISTS service_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type_id uuid NOT NULL REFERENCES service_types(id),
  performed_at date NOT NULL DEFAULT CURRENT_DATE,
  odometer_at_service integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  cost decimal(10,2),
  shop_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_logs' AND policyname = 'Users can view own service logs') THEN
    CREATE POLICY "Users can view own service logs" ON service_logs FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_logs.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_logs' AND policyname = 'Users can insert own service logs') THEN
    CREATE POLICY "Users can insert own service logs" ON service_logs FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_logs.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_logs' AND policyname = 'Users can update own service logs') THEN
    CREATE POLICY "Users can update own service logs" ON service_logs FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_logs.vehicle_id AND vehicles.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_logs.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_logs' AND policyname = 'Users can delete own service logs') THEN
    CREATE POLICY "Users can delete own service logs" ON service_logs FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_logs.vehicle_id AND vehicles.user_id = auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_vehicle_id ON service_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_performed_at ON service_logs(performed_at DESC);
