// Generated database types for the Supabase project.
// Reflects the actual schema — update this file when migrations add or change columns.
// The Supabase client in lib/supabase.ts is parameterised with this type so that
// all .from() calls, .select() results, and .insert()/.update() payloads are
// checked against the real schema at compile time.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          distance_unit: string;
          preferred_vehicle_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          distance_unit?: string;
          preferred_vehicle_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          distance_unit?: string;
          preferred_vehicle_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          make: string;
          model: string;
          year: number;
          nickname: string | null;
          vin: string | null;
          color: string | null;
          current_odometer: number;
          odometer_unit: string;
          odometer_km: number;
          image_url: string | null;
          engine: string | null;
          drivetrain: string | null;
          is_primary: boolean;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          make?: string;
          model?: string;
          year?: number;
          nickname?: string | null;
          vin?: string | null;
          color?: string | null;
          current_odometer?: number;
          odometer_unit?: string;
          odometer_km?: number;
          image_url?: string | null;
          engine?: string | null;
          drivetrain?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          make?: string;
          model?: string;
          year?: number;
          nickname?: string | null;
          vin?: string | null;
          color?: string | null;
          current_odometer?: number;
          odometer_unit?: string;
          odometer_km?: number;
          image_url?: string | null;
          engine?: string | null;
          drivetrain?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      service_types: {
        Row: {
          id: string;
          name: string;
          default_interval_miles: number | null;
          default_interval_km: number | null;
          default_interval_months: number | null;
          icon_name: string | null;
          sort_order: number | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          default_interval_miles?: number | null;
          default_interval_km?: number | null;
          default_interval_months?: number | null;
          icon_name?: string | null;
          sort_order?: number | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          default_interval_miles?: number | null;
          default_interval_km?: number | null;
          default_interval_months?: number | null;
          icon_name?: string | null;
          sort_order?: number | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      vehicle_service_intervals: {
        Row: {
          id: string;
          vehicle_id: string;
          service_type_id: string;
          interval_miles: number | null;
          interval_km: number | null;
          interval_months: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          service_type_id: string;
          interval_miles?: number | null;
          interval_km?: number | null;
          interval_months?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          service_type_id?: string;
          interval_miles?: number | null;
          interval_km?: number | null;
          interval_months?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicle_service_intervals_service_type_id_fkey';
            columns: ['service_type_id'];
            isOneToOne: false;
            referencedRelation: 'service_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_service_intervals_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
      service_logs: {
        Row: {
          id: string;
          vehicle_id: string;
          service_type_id: string;
          performed_at: string;
          odometer_at_service: number;
          odometer_km_at_service: number | null;
          notes: string | null;
          cost: number | null;
          shop_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          service_type_id: string;
          performed_at?: string;
          odometer_at_service?: number;
          odometer_km_at_service?: number | null;
          notes?: string | null;
          cost?: number | null;
          shop_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          service_type_id?: string;
          performed_at?: string;
          odometer_at_service?: number;
          odometer_km_at_service?: number | null;
          notes?: string | null;
          cost?: number | null;
          shop_name?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_logs_service_type_id_fkey';
            columns: ['service_type_id'];
            isOneToOne: false;
            referencedRelation: 'service_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_logs_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_primary_vehicle: {
        Args: { vehicle_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}

// Convenience row-type aliases
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type ServiceTypeRow = Database['public']['Tables']['service_types']['Row'];
export type VehicleServiceIntervalRow = Database['public']['Tables']['vehicle_service_intervals']['Row'];
export type ServiceLogRow = Database['public']['Tables']['service_logs']['Row'];
