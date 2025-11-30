export type SessionPackageRecord = {
  id: string;
  tutor_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  session_count: number | null;
  total_minutes: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
