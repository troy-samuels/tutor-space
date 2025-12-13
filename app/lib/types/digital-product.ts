export type DigitalProductRecord = {
  id: string;
  tutor_id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  fulfillment_type: "file" | "link";
  storage_path: string | null;
  external_url: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  // Marketplace stats
  total_sales?: number | null;
  total_revenue_cents?: number | null;
  // Discovery metadata
  category?: string | null;
  language?: string | null;
  level?: string | null;
};
