"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export interface PaymentRecord {
  id: string;
  booking_id: string | null;
  digital_product_purchase_id: string | null;
  amount_cents: number;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  // Related data
  booking?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    services: { name: string } | null;
  } | null;
  digital_product?: {
    id: string;
    title: string;
  } | null;
  tutor?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface PackagePurchaseRecord {
  id: string;
  total_price_cents: number;
  currency: string;
  remaining_minutes: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  session_package_templates: {
    name: string;
    session_count: number;
    total_minutes: number;
  } | null;
  tutor?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface BillingSummary {
  totalSpent: number;
  currency: string;
  lessonsPurchased: number;
  productsPurchased: number;
  packagesPurchased: number;
}

/**
 * Get student billing history
 */
export async function getStudentBillingHistory(): Promise<{
  payments: PaymentRecord[];
  packages: PackagePurchaseRecord[];
  summary: BillingSummary;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      payments: [],
      packages: [],
      summary: { totalSpent: 0, currency: "USD", lessonsPurchased: 0, productsPurchased: 0, packagesPurchased: 0 },
    };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return {
      payments: [],
      packages: [],
      summary: { totalSpent: 0, currency: "USD", lessonsPurchased: 0, productsPurchased: 0, packagesPurchased: 0 },
    };
  }

  // Get all student IDs for this user
  const { data: students } = await serviceClient
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id);

  const studentIds = students?.map((s) => s.id) || [];
  const tutorIds = students?.map((s) => s.tutor_id) || [];

  if (studentIds.length === 0) {
    return {
      payments: [],
      packages: [],
      summary: { totalSpent: 0, currency: "USD", lessonsPurchased: 0, productsPurchased: 0, packagesPurchased: 0 },
    };
  }

  // Fetch bookings with payment info
  const { data: bookings } = await serviceClient
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      payment_status,
      payment_amount,
      currency,
      created_at,
      services (name),
      profiles:tutor_id (full_name, email)
    `)
    .in("student_id", studentIds)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  // Fetch digital product purchases
  const { data: productPurchases } = await serviceClient
    .from("digital_product_purchases")
    .select(`
      id,
      price_cents,
      currency,
      status,
      created_at,
      digital_products (id, title, profiles:tutor_id (full_name, email))
    `)
    .eq("customer_email", user.email)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  // Fetch session package purchases
  const { data: packagePurchases } = await serviceClient
    .from("session_package_purchases")
    .select(`
      id,
      total_price_cents,
      currency,
      remaining_minutes,
      status,
      expires_at,
      created_at,
      session_package_templates (name, session_count, total_minutes),
      profiles:tutor_id (full_name, email)
    `)
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  // Transform booking payments
  const bookingPayments: PaymentRecord[] = (bookings || []).map((b) => ({
    id: b.id,
    booking_id: b.id,
    digital_product_purchase_id: null,
    amount_cents: b.payment_amount || 0,
    currency: b.currency || "USD",
    payment_status: b.payment_status,
    payment_method: null,
    stripe_payment_intent_id: null,
    created_at: b.created_at,
    booking: {
      id: b.id,
      scheduled_at: b.scheduled_at,
      duration_minutes: b.duration_minutes,
      services: Array.isArray(b.services) ? b.services[0] || null : b.services,
    },
    digital_product: null,
    tutor: Array.isArray(b.profiles) ? b.profiles[0] || null : b.profiles,
  }));

  // Transform product payments
  const productPayments: PaymentRecord[] = (productPurchases || []).map((p) => {
    const product = Array.isArray(p.digital_products) ? p.digital_products[0] : p.digital_products;
    const tutorProfile = product?.profiles;
    return {
      id: p.id,
      booking_id: null,
      digital_product_purchase_id: p.id,
      amount_cents: p.price_cents,
      currency: p.currency || "USD",
      payment_status: p.status,
      payment_method: null,
      stripe_payment_intent_id: null,
      created_at: p.created_at,
      booking: null,
      digital_product: product ? {
        id: product.id,
        title: product.title,
      } : null,
      tutor: Array.isArray(tutorProfile) ? tutorProfile[0] || null : tutorProfile || null,
    };
  });

  // Combine and sort all payments
  const allPayments = [...bookingPayments, ...productPayments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Transform packages
  const packages: PackagePurchaseRecord[] = (packagePurchases || []).map((p) => {
    const template = Array.isArray(p.session_package_templates)
      ? p.session_package_templates[0]
      : p.session_package_templates;
    return {
      id: p.id,
      total_price_cents: p.total_price_cents,
      currency: p.currency || "USD",
      remaining_minutes: p.remaining_minutes,
      status: p.status,
      expires_at: p.expires_at,
      created_at: p.created_at,
      session_package_templates: template || null,
      tutor: Array.isArray(p.profiles) ? p.profiles[0] || null : p.profiles,
    };
  });

  // Calculate summary
  const lessonTotal = bookingPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const productTotal = productPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const packageTotal = packages.reduce((sum, p) => sum + p.total_price_cents, 0);

  const summary: BillingSummary = {
    totalSpent: lessonTotal + productTotal + packageTotal,
    currency: "USD",
    lessonsPurchased: bookingPayments.length,
    productsPurchased: productPayments.length,
    packagesPurchased: packages.length,
  };

  return { payments: allPayments, packages, summary };
}

