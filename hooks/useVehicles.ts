import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { toKm } from '@/utils/units';
import type { Vehicle, OdometerUnit } from '@/types/database';

// ─── Create input ─────────────────────────────────────────────────────────────

// Fields the caller must supply when creating a vehicle
export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  nickname: string;
  current_odometer: number;
  odometer_unit: OdometerUnit;
  color: string;
  engine?: string;
  drivetrain?: string;
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────

/**
 * Seeds vehicle_service_intervals rows for a newly created vehicle.
 * Inserts one row per service type (all active templates), using each type's
 * canonical interval values. Safe against duplicates via upsert.
 * Returns an error message on failure, null on success.
 */
async function seedAllIntervals(vehicleId: string): Promise<string | null> {
  const { data: types, error: fetchErr } = await supabase
    .from('service_types')
    .select('id, default_interval_km, default_interval_miles, default_interval_months')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (fetchErr) return fetchErr.message;
  if (!types || types.length === 0) return null;

  const rows = types.map((t: {
    id: string;
    default_interval_km: number | null;
    default_interval_miles: number | null;
    default_interval_months: number | null;
  }) => ({
    vehicle_id: vehicleId,
    service_type_id: t.id,
    interval_km: t.default_interval_km ?? (
      t.default_interval_miles != null
        ? Math.round(t.default_interval_miles * 1.60934)
        : null
    ),
    interval_miles: t.default_interval_miles,
    interval_months: t.default_interval_months,
  }));

  const { error: upsertErr } = await supabase
    .from('vehicle_service_intervals')
    .upsert(rows, { onConflict: 'vehicle_id,service_type_id' });

  return upsertErr?.message ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setVehicles(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ── Add vehicle ────────────────────────────────────────────────────────────
  const addVehicle = async (input: CreateVehicleInput): Promise<Vehicle | null> => {
    if (!user) return null;

    const isFirst = vehicles.length === 0;
    const odometerKm = toKm(input.current_odometer, input.odometer_unit);

    const { data, error: err } = await supabase
      .from('vehicles')
      .insert({
        ...input,
        engine:      input.engine ?? '',
        drivetrain:  input.drivetrain ?? '',
        odometer_km: odometerKm,
        user_id:     user.id,
        is_primary:  isFirst,
        is_active:   true,
      })
      .select()
      .single();

    if (err || !data) return null;

    // Seed maintenance intervals for all active service templates.
    // Non-fatal — vehicle is already created; surface error through hook state.
    const seedErr = await seedAllIntervals(data.id);
    if (seedErr) setError(`Vehicle created but maintenance setup failed: ${seedErr}`);

    setVehicles(prev => [...prev, data]);
    return data;
  };

  // ── Update vehicle ─────────────────────────────────────────────────────────
  const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
    // If current_odometer is being updated, recalculate odometer_km canonically
    const vehicle = vehicles.find(v => v.id === id);
    const patch: Partial<Vehicle> & { odometer_km?: number } = { ...updates };

    if (updates.current_odometer !== undefined) {
      const unit = updates.odometer_unit ?? vehicle?.odometer_unit ?? 'km';
      patch.odometer_km = toKm(updates.current_odometer, unit);
    }

    const { data, error: err } = await supabase
      .from('vehicles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!err && data) {
      setVehicles(prev => prev.map(v => v.id === id ? data : v));
      return data;
    }
    return null;
  };

  // ── Delete vehicle (soft-delete via is_active=false) ──────────────────────
  const deleteVehicle = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('vehicles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!err) setVehicles(prev => prev.filter(v => v.id !== id));
    return !err;
  };

  // ── Set primary ────────────────────────────────────────────────────────────
  // Delegates to the set_primary_vehicle RPC which atomically clears all
  // is_primary flags and sets the chosen vehicle in one transaction.
  const setPrimary = async (id: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase.rpc('set_primary_vehicle', { vehicle_id: id });
    if (error) return false;

    setVehicles(prev => prev.map(v => ({ ...v, is_primary: v.id === id })));
    return true;
  };

  return {
    vehicles,
    loading,
    error,
    refetch: fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setPrimary,
  };
}
