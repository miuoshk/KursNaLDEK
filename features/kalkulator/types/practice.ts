export type Practice = {
  id: string;
  owner_id: string;
  name: string;
  city: string | null;
  voivodeship: string | null;
  monthly_station_cost: number | null;
  station_hours_per_month: number | null;
  station_cost_per_hour: number | null;
  doctor_rate_per_hour: number | null;
  assistant_rate_per_hour: number | null;
  created_at: string;
  updated_at: string;
};
