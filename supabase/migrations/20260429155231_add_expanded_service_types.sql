/*
  # Add expanded service types

  1. Renames
     - "Air Filter" → "Engine Air Filter" (sort_order 6)
     - "Coolant Flush" → "Coolant / Antifreeze" (sort_order 9)

  2. New service types (all is_default = false so existing vehicles are unaffected)
     - Tire Rotation (sort 13, 5,000 mi / 8,047 km / 6 mo, icon: rotate-cw)
     - Brake Fluid (sort 14, 30,000 mi / 48,280 km / 24 mo, icon: droplets)
     - Wiper Blades (sort 15, 12,000 mi / 19,312 km / 12 mo, icon: eye)
     - Transfer Case Fluid (sort 16, 30,000 mi / 48,280 km / 36 mo, icon: droplets)
     - Tire Pressure (sort 17, 5,000 mi / 8,047 km / 1 mo, icon: gauge)

  3. No destructive operations — existing vehicle_service_interval rows are untouched.
*/

-- Rename existing types to match the user-facing names
UPDATE service_types SET name = 'Engine Air Filter'    WHERE name = 'Air Filter';
UPDATE service_types SET name = 'Coolant / Antifreeze' WHERE name = 'Coolant Flush';

-- Insert new service types
INSERT INTO service_types (name, default_interval_miles, default_interval_km, default_interval_months, icon_name, sort_order, is_default)
VALUES
  ('Tire Rotation',       5000,  8047,  6,  'rotate-cw', 13, false),
  ('Brake Fluid',         30000, 48280, 24, 'droplets',  14, false),
  ('Wiper Blades',        12000, 19312, 12, 'eye',       15, false),
  ('Transfer Case Fluid', 30000, 48280, 36, 'droplets',  16, false),
  ('Tire Pressure',       5000,  8047,  1,  'gauge',     17, false)
ON CONFLICT DO NOTHING;
