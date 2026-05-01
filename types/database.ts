import type {
  ProfileRow,
  VehicleRow,
  ServiceTypeRow,
  VehicleServiceIntervalRow,
  ServiceLogRow,
} from '@/supabase/database.types';

// ─── Scalar domain types ──────────────────────────────────────────────────────

export type ServiceStatus = 'good' | 'due_soon' | 'overdue' | 'unknown';

// The DB stores odometer_unit as plain text. We constrain it here to the two
// values the app actually writes so the rest of the codebase can use a union.
export type OdometerUnit = 'mi' | 'km';

// ─── Profile ──────────────────────────────────────────────────────────────────
// Derives from the generated row type. distance_unit is plain text in the DB;
// we narrow it to OdometerUnit here. display_name and avatar_url are nullable
// in the DB — callers use ?? '' for display.

export type Profile = Omit<ProfileRow, 'distance_unit'> & {
  /** User's preferred display unit for distances. All DB values are stored in km. */
  distance_unit: OdometerUnit;
};

// ─── Vehicle ──────────────────────────────────────────────────────────────────
// odometer_unit is plain text in the DB; narrow it to OdometerUnit here.
// The hook casts raw DB rows to this type after asserting the unit value.

export type Vehicle = Omit<VehicleRow, 'odometer_unit'> & {
  /** The unit the user entered current_odometer in — used only for display. */
  odometer_unit: OdometerUnit;
  /**
   * CANONICAL odometer value stored in kilometers.
   * All interval comparisons must use this field.
   */
  odometer_km: number;
  /**
   * Display-unit odometer reading as entered by the user.
   * Use odometer_km for all interval math.
   */
  current_odometer: number;
};

// ─── ServiceType ──────────────────────────────────────────────────────────────
// Direct alias — the generated row type matches exactly.

export type ServiceType = ServiceTypeRow;

// ─── VehicleServiceInterval ───────────────────────────────────────────────────

export type VehicleServiceInterval = VehicleServiceIntervalRow;

// ─── ServiceLog ───────────────────────────────────────────────────────────────
// Extends the base row with optional joined fields that are present when the
// query includes service_type:service_types(*).

export type ServiceLog = ServiceLogRow & {
  // Joined fields (present when query includes service_type:service_types(*))
  service_type?: ServiceType;
  vehicle?: Vehicle;
};

// ─── MaintenanceCardData ──────────────────────────────────────────────────────
// Pure UI/domain type — no direct DB row equivalent.

export interface MaintenanceCardData {
  serviceType: ServiceType;
  lastLog: ServiceLog | null;
  status: ServiceStatus;
  /**
   * Effective interval in canonical km (merged from override or service_type default).
   * Used for all progress and status calculations.
   */
  intervalKm: number | null;
  intervalMonths: number | null;
  /** km travelled since last service (canonical) */
  kmSinceService: number | null;
  /** km remaining until next service is due (canonical; negative = overdue) */
  kmUntilDue: number | null;
  /** Absolute canonical km odometer at which next service is due */
  nextDueKm: number | null;
  /** Exact calendar date by which next service is due (performed_at + intervalMonths) */
  nextDueDate: Date | null;
  monthsSinceService: number | null;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Returns the best display name for a vehicle. Never returns null. */
export function vehicleDisplayName(v: Vehicle): string {
  return v.nickname || `${v.year} ${v.make} ${v.model}`;
}

/** Returns the year/make/model string regardless of nickname. */
export function vehicleYearMakeModel(v: Vehicle): string {
  return `${v.year} ${v.make} ${v.model}`;
}
