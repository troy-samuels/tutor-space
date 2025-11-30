import type { ServiceOfferType } from "@/lib/validators/service";

export type ServiceRecord = {
  id: string;
  tutor_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number; // cents (legacy column)
  currency: string | null;
  price_amount?: number | null; // preferred cents column
  price_currency?: string | null;
  is_active: boolean;
  requires_approval: boolean;
  max_students_per_session: number;
  offer_type: ServiceOfferType;
  created_at: string;
  updated_at: string;
};
