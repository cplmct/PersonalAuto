import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toKm } from '@/utils/units';
import type {
  ServiceType,
  ServiceLog,
  VehicleServiceInterval,
  MaintenanceCardData,
  OdometerUnit,
} from '@/types/database';
import { buildMaintenanceCardData } from '@/utils/maintenance';

// ─── All service types (global reference data, fetched once) ──────────────────
// Returns only active service types ordered by sort_order. Callers filter
// further by is_default or by whether a vehicle_service_interval row exists.

export function useServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setServiceTypes(data ?? []);
        setLoading(false);
      });
  }, []);

  return { serviceTypes, loading, error };
}

// ─── Per-vehicle service interval overrides ───────────────────────────────────
// Fetches only the interval rows that exist for this vehicle (i.e. the service
// types the vehicle is actively tracking). The set of tracked service types
// is therefore entirely data-driven: if a vehicle_service_interval row exists
// for a service_type, that type appears on the Dashboard.

export function useVehicleIntervals(vehicleId: string | null) {
  const [intervals, setIntervals] = useState<VehicleServiceInterval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntervals = useCallback(async () => {
    if (!vehicleId) {
      setIntervals([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('vehicle_service_intervals')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (err) setError(err.message);
    else setIntervals(data ?? []);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    fetchIntervals();
  }, [fetchIntervals]);

  /**
   * Persist an interval override. Accepts a display-unit distance value alongside
   * months. Converts to canonical km before saving.
   *
   * @param displayUnit - the unit intervalDist is expressed in
   */
  const updateInterval = async (
    serviceTypeId: string,
    patch: {
      /** Display-unit distance value — pass null to clear */
      intervalDist?: number | null;
      interval_months?: number | null;
    },
    displayUnit: OdometerUnit = 'km',
  ): Promise<boolean> => {
    if (!vehicleId) return false;

    // Convert the display-unit distance to canonical km
    const intervalKm =
      patch.intervalDist != null
        ? toKm(patch.intervalDist, displayUnit)
        : null;

    const dbPatch = {
      // Only write the legacy miles column when the user is in miles mode
      interval_miles: displayUnit === 'mi' ? (patch.intervalDist ?? null) : null,
      interval_km: intervalKm,
      interval_months: patch.interval_months ?? null,
    };

    const { data, error: err } = await supabase
      .from('vehicle_service_intervals')
      .update(dbPatch)
      .eq('vehicle_id', vehicleId)
      .eq('service_type_id', serviceTypeId)
      .select('*')
      .maybeSingle();

    if (err || !data) return false;
    setIntervals(prev =>
      prev.map(i =>
        i.service_type_id === serviceTypeId ? (data as VehicleServiceInterval) : i
      )
    );
    return true;
  };

  /**
   * Add a new service type to this vehicle's tracked list (inserts an interval row).
   * Uses the service_type's defaults unless overrides are supplied.
   */
  const addServiceType = async (
    serviceTypeId: string,
    defaults: { interval_km: number | null; interval_miles: number | null; interval_months: number | null },
  ): Promise<boolean> => {
    if (!vehicleId) return false;

    const { data, error: err } = await supabase
      .from('vehicle_service_intervals')
      .upsert(
        {
          vehicle_id: vehicleId,
          service_type_id: serviceTypeId,
          interval_km: defaults.interval_km,
          interval_miles: defaults.interval_miles,
          interval_months: defaults.interval_months,
        },
        { onConflict: 'vehicle_id,service_type_id' },
      )
      .select('*')
      .maybeSingle();

    if (err || !data) return false;

    setIntervals(prev => {
      const exists = prev.some(i => i.service_type_id === serviceTypeId);
      return exists
        ? prev.map(i => i.service_type_id === serviceTypeId ? (data as VehicleServiceInterval) : i)
        : [...prev, data as VehicleServiceInterval];
    });
    return true;
  };

  /**
   * Remove a service type from this vehicle's tracked list (deletes the interval row).
   */
  const removeServiceType = async (serviceTypeId: string): Promise<boolean> => {
    if (!vehicleId) return false;

    const { error: err } = await supabase
      .from('vehicle_service_intervals')
      .delete()
      .eq('vehicle_id', vehicleId)
      .eq('service_type_id', serviceTypeId);

    if (!err) {
      setIntervals(prev => prev.filter(i => i.service_type_id !== serviceTypeId));
    }
    return !err;
  };

  return {
    intervals,
    loading,
    error,
    refetch: fetchIntervals,
    updateInterval,
    addServiceType,
    removeServiceType,
  };
}

// ─── Service logs for a vehicle ───────────────────────────────────────────────

export function useServiceLogs(vehicleId: string | null) {
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!vehicleId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('service_logs')
      .select('*, service_type:service_types(*)')
      .eq('vehicle_id', vehicleId)
      .order('performed_at', { ascending: false });

    if (err) setError(err.message);
    else setLogs(data ?? []);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Insert a new service log. Accepts display-unit odometer values; the hook
   * converts to canonical km before saving.
   *
   * @param displayUnit - the unit odometer_at_service is expressed in
   */
  const addLog = async (
    log: Omit<ServiceLog, 'id' | 'created_at' | 'odometer_km_at_service'>,
    displayUnit: OdometerUnit = 'km',
  ): Promise<ServiceLog | null> => {
    const odometerKm = toKm(log.odometer_at_service, displayUnit);

    // Destructure joined fields (service_type, vehicle) out before inserting —
    // those are query-time joins, not real columns.
    const { service_type: _st, vehicle: _v, ...dbFields } = log;

    const { data, error: err } = await supabase
      .from('service_logs')
      .insert({ ...dbFields, odometer_km_at_service: odometerKm })
      .select('*, service_type:service_types(*)')
      .single();

    if (err || !data) return null;
    setLogs(prev => [data, ...prev]);
    return data;
  };

  const deleteLog = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('service_logs').delete().eq('id', id);
    if (!err) setLogs(prev => prev.filter(l => l.id !== id));
    return !err;
  };

  return { logs, loading, error, refetch: fetchLogs, addLog, deleteLog };
}

// ─── Derived maintenance cards ────────────────────────────────────────────────
// Pure synchronous derivation via useMemo — no async, no setState.
//
// The set of cards shown on the Dashboard is driven entirely by which
// vehicle_service_interval rows exist for the vehicle. Each interval row
// corresponds to one active ServiceType. useServiceTypes() provides the full
// catalogue; we join here rather than re-fetching.

export function useMaintenanceCards(
  vehicleId: string | null,
  /** Canonical km odometer of the active vehicle */
  currentOdometerKm: number,
  serviceTypes: ServiceType[],
  logs: ServiceLog[],
  intervals: VehicleServiceInterval[],
): MaintenanceCardData[] {
  const serviceTypeMap = useMemo(
    () => new Map(serviceTypes.map(st => [st.id, st])),
    [serviceTypes],
  );

  return useMemo(() => {
    if (!vehicleId || serviceTypes.length === 0) return [];

    return intervals
      .map(interval => {
        const st = serviceTypeMap.get(interval.service_type_id);
        if (!st) return null;
        return buildMaintenanceCardData(st, logs, currentOdometerKm, interval);
      })
      .filter((c): c is MaintenanceCardData => c !== null)
      .sort((a, b) => (a.serviceType.sort_order ?? 0) - (b.serviceType.sort_order ?? 0));
  }, [vehicleId, currentOdometerKm, serviceTypeMap, logs, intervals]);
}
