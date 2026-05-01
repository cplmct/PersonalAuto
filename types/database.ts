export type ServiceStatus = 'good' | 'due_soon' | 'overdue' | 'unknown';

export type OdometerUnit = 'mi' | 'km';

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  /** User's preferred display unit for distances. All DB values are stored in km. */
  distance_unit: OdometerUnit;
  /**
   * The vehicle the user wants to see by default on the Dashboard.
   * Null means fall back to the vehicle where is_primary = true.
   */
  preferred_vehicle_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  nickname: string | null;
  /**
   * Display-unit odometer reading as entered by the user.
   * Use odometer_km for all interval math.
   */
  current_odometer: number;
  /** The unit the user entered current_odometer in — used only for display. */
  odometer_unit: OdometerUnit;
  /**
   * CANONICAL odometer value stored in kilometers.
   * All interval comparisons must use this field.
   * Converted from current_odometer on write; converted back for display.
   */
  odometer_km: number;
  color: string | null;
  engine: string | null;
  drivetrain: string | null;
  vin: string | null;
  image_url: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── ServiceType ──────────────────────────────────────────────────────────────

export interface ServiceType {
  id: string;
  name: string;
  /** Legacy miles-based default — kept for backwards compatibility. Prefer default_interval_km. */
  default_interval_miles: number | null;
  /**
   * CANONICAL km-based default interval.
   * This is the authoritative value for interval math.
   */
  default_interval_km: number | null;
  default_interval_months: number | null;
  icon_name: string;
  sort_order: number;
  /** True for the original 5 seeded service types that are enabled for every new vehicle. */
  is_default: boolean;
  /** False for retired/disabled templates — excluded from the catalogue and new-vehicle seeding. */
  is_active: boolean;
  created_at: string;
}

// ─── VehicleServiceInterval ───────────────────────────────────────────────────

export interface VehicleServiceInterval {
  id: string;
  vehicle_id: string;
  service_type_id: string;
  /** Legacy miles-based override — kept for backwards compatibility. Prefer interval_km. */
  interval_miles: number | null;
  /**
   * CANONICAL km-based override interval.
   * When present, this takes precedence over interval_miles and service_type defaults.
   */
  interval_km: number | null;
  interval_months: number | null;
  created_at: string;
}

// ─── ServiceLog ───────────────────────────────────────────────────────────────

export interface ServiceLog {
  id: string;
  vehicle_id: string;
  service_type_id: string;
  performed_at: string;
  /** Display-unit odometer at time of service. Use odometer_km_at_service for math. */
  odometer_at_service: number;
  /**
   * CANONICAL km odometer at time of service.
   * All "miles since last service" calculations must use this field.
   */
  odometer_km_at_service: number | null;
  notes: string | null;
  cost: number | null;
  shop_name: string | null;
  created_at: string;
  // Joined fields (present when query includes service_type:service_types(*))
  service_type?: ServiceType;
  vehicle?: Vehicle;
}

// ─── MaintenanceCardData ──────────────────────────────────────────────────────

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
