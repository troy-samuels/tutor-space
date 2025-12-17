/**
 * Stripe Mock Utilities for Enterprise-Grade Testing
 *
 * Provides factories for creating mock Stripe objects:
 * - Events (webhooks)
 * - Checkout Sessions
 * - Subscriptions
 * - Accounts (Connect)
 * - Invoices
 * - Payment Intents
 */

import type Stripe from "stripe";

// ============================================
// ID GENERATORS
// ============================================

let idCounter = 0;

export function generateStripeId(prefix: string): string {
  return `${prefix}_test_${Date.now()}_${++idCounter}`;
}

export const generateEventId = () => generateStripeId("evt");
export const generateSessionId = () => generateStripeId("cs");
export const generateSubscriptionId = () => generateStripeId("sub");
export const generateCustomerId = () => generateStripeId("cus");
export const generateAccountId = () => generateStripeId("acct");
export const generatePaymentIntentId = () => generateStripeId("pi");
export const generateInvoiceId = () => generateStripeId("in");
export const generatePriceId = () => generateStripeId("price");
export const generateProductId = () => generateStripeId("prod");

// ============================================
// STRIPE EVENT FACTORY
// ============================================

export interface MockEventOptions<T = unknown> {
  id?: string;
  type: string;
  data: T;
  livemode?: boolean;
  created?: number;
}

export function createMockStripeEvent<T>(options: MockEventOptions<T>): Stripe.Event {
  return {
    id: options.id || generateEventId(),
    object: "event",
    api_version: "2024-10-28",
    created: options.created || Math.floor(Date.now() / 1000),
    data: {
      object: options.data as Stripe.Event.Data.Object,
      previous_attributes: undefined,
    },
    livemode: options.livemode ?? false,
    pending_webhooks: 0,
    request: {
      id: generateStripeId("req"),
      idempotency_key: null,
    },
    type: options.type,
  } as Stripe.Event;
}

// ============================================
// CHECKOUT SESSION MOCKS
// ============================================

export interface MockCheckoutSessionOptions {
  id?: string;
  mode?: "payment" | "subscription" | "setup";
  paymentStatus?: "paid" | "unpaid" | "no_payment_required";
  paymentIntent?: string | null;
  amountTotal?: number;
  currency?: string;
  customerId?: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
}

export function createMockCheckoutSession(
  options: MockCheckoutSessionOptions = {}
): Stripe.Checkout.Session {
  return {
    id: options.id || generateSessionId(),
    object: "checkout.session",
    after_expiration: null,
    allow_promotion_codes: null,
    amount_subtotal: options.amountTotal || 0,
    amount_total: options.amountTotal || 0,
    automatic_tax: { enabled: false, status: null, liability: null },
    billing_address_collection: null,
    cancel_url: "https://example.com/cancel",
    client_reference_id: null,
    client_secret: null,
    consent: null,
    consent_collection: null,
    created: Math.floor(Date.now() / 1000),
    currency: options.currency || "usd",
    currency_conversion: null,
    custom_fields: [],
    custom_text: { shipping_address: null, submit: null, after_submit: null, terms_of_service_acceptance: null },
    customer: options.customerId || null,
    customer_creation: null,
    customer_details: options.customerEmail ? { email: options.customerEmail } : null,
    customer_email: options.customerEmail || null,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    invoice: null,
    invoice_creation: null,
    livemode: false,
    locale: null,
    metadata: options.metadata || {},
    mode: options.mode || "payment",
    payment_intent: options.paymentIntent || generatePaymentIntentId(),
    payment_link: null,
    payment_method_collection: null,
    payment_method_configuration_details: null,
    payment_method_options: null,
    payment_method_types: ["card"],
    payment_status: options.paymentStatus || "paid",
    phone_number_collection: { enabled: false },
    recovered_from: null,
    redirect_on_completion: null,
    return_url: null,
    saved_payment_method_options: null,
    setup_intent: null,
    shipping_address_collection: null,
    shipping_cost: null,
    shipping_details: null,
    shipping_options: [],
    status: "complete",
    submit_type: null,
    subscription: null,
    success_url: "https://example.com/success",
    total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
    ui_mode: "hosted",
    url: null,
  } as unknown as Stripe.Checkout.Session;
}

// ============================================
// SUBSCRIPTION MOCKS
// ============================================

export interface MockSubscriptionOptions {
  id?: string;
  customerId?: string;
  status?: Stripe.Subscription.Status;
  priceId?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
  trialEnd?: number | null;
}

export function createMockSubscription(
  options: MockSubscriptionOptions = {}
): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  const priceId = options.priceId || generatePriceId();

  return {
    id: options.id || generateSubscriptionId(),
    object: "subscription",
    application: null,
    application_fee_percent: null,
    automatic_tax: { enabled: false, liability: null },
    billing_cycle_anchor: options.currentPeriodStart || now,
    billing_cycle_anchor_config: null,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: options.cancelAtPeriodEnd ?? false,
    canceled_at: null,
    cancellation_details: null,
    collection_method: "charge_automatically",
    created: now,
    currency: "usd",
    current_period_end: options.currentPeriodEnd || now + 30 * 24 * 60 * 60,
    current_period_start: options.currentPeriodStart || now,
    customer: options.customerId || generateCustomerId(),
    days_until_due: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    discounts: [],
    ended_at: null,
    invoice_settings: { account_tax_ids: null, issuer: { type: "self" } },
    items: {
      object: "list",
      data: [
        {
          id: generateStripeId("si"),
          object: "subscription_item",
          billing_thresholds: null,
          created: now,
          current_period_end: now + 30 * 24 * 60 * 60,
          current_period_start: now,
          discounts: [],
          metadata: {},
          plan: {
            id: priceId,
            object: "plan",
            active: true,
            aggregate_usage: null,
            amount: 3900,
            amount_decimal: "3900",
            billing_scheme: "per_unit",
            created: now,
            currency: "usd",
            interval: "month",
            interval_count: 1,
            livemode: false,
            metadata: {},
            meter: null,
            nickname: null,
            product: generateProductId(),
            tiers_mode: null,
            transform_usage: null,
            trial_period_days: null,
            usage_type: "licensed",
          },
          price: {
            id: priceId,
            object: "price",
            active: true,
            billing_scheme: "per_unit",
            created: now,
            currency: "usd",
            custom_unit_amount: null,
            livemode: false,
            lookup_key: null,
            metadata: {},
            nickname: null,
            product: generateProductId(),
            recurring: {
              aggregate_usage: null,
              interval: "month",
              interval_count: 1,
              usage_type: "licensed",
              meter: null,
              trial_period_days: null,
            },
            tax_behavior: "unspecified",
            tiers_mode: null,
            transform_quantity: null,
            type: "recurring",
            unit_amount: 3900,
            unit_amount_decimal: "3900",
          } as Stripe.Price,
          quantity: 1,
          subscription: options.id || generateSubscriptionId(),
          tax_rates: [],
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "/v1/subscription_items",
    },
    latest_invoice: null,
    livemode: false,
    metadata: options.metadata || {},
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: null,
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    schedule: null,
    start_date: now,
    status: options.status || "active",
    test_clock: null,
    transfer_data: null,
    trial_end: options.trialEnd ?? null,
    trial_settings: null,
    trial_start: null,
  } as unknown as Stripe.Subscription;
}

// ============================================
// CONNECT ACCOUNT MOCKS
// ============================================

export interface MockConnectAccountOptions {
  id?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  defaultCurrency?: string;
  country?: string;
  disabledReason?: string | null;
  currentlyDue?: string[];
  eventuallyDue?: string[];
  pastDue?: string[];
  pendingVerification?: string[];
}

export function createMockConnectAccount(
  options: MockConnectAccountOptions = {}
): Stripe.Account {
  return {
    id: options.id || generateAccountId(),
    object: "account",
    business_profile: null,
    business_type: "individual",
    capabilities: {
      card_payments: options.chargesEnabled ? "active" : "inactive",
      transfers: options.payoutsEnabled ? "active" : "inactive",
    },
    charges_enabled: options.chargesEnabled ?? true,
    controller: null,
    country: options.country || "US",
    created: Math.floor(Date.now() / 1000),
    default_currency: options.defaultCurrency || "usd",
    details_submitted: options.detailsSubmitted ?? true,
    email: "tutor@example.com",
    external_accounts: null,
    future_requirements: null,
    metadata: {},
    payouts_enabled: options.payoutsEnabled ?? true,
    requirements: {
      alternatives: null,
      current_deadline: null,
      currently_due: options.currentlyDue || [],
      disabled_reason: options.disabledReason || null,
      errors: [],
      eventually_due: options.eventuallyDue || [],
      past_due: options.pastDue || [],
      pending_verification: options.pendingVerification || [],
    },
    settings: null,
    tos_acceptance: null,
    type: "express",
  } as unknown as Stripe.Account;
}

// ============================================
// INVOICE MOCKS
// ============================================

export interface MockInvoiceOptions {
  id?: string;
  customerId?: string;
  subscriptionId?: string | null;
  amountDue?: number;
  amountPaid?: number;
  currency?: string;
  status?: Stripe.Invoice.Status;
  nextPaymentAttempt?: number | null;
}

export function createMockInvoice(options: MockInvoiceOptions = {}): Stripe.Invoice {
  return {
    id: options.id || generateInvoiceId(),
    object: "invoice",
    account_country: "US",
    account_name: "TutorLingua",
    account_tax_ids: null,
    amount_due: options.amountDue || 3900,
    amount_paid: options.amountPaid || 0,
    amount_remaining: options.amountDue || 3900,
    amount_shipping: 0,
    application: null,
    application_fee_amount: null,
    attempt_count: 1,
    attempted: true,
    automatic_tax: { enabled: false, status: null, liability: null },
    billing_reason: "subscription_cycle",
    charge: null,
    collection_method: "charge_automatically",
    created: Math.floor(Date.now() / 1000),
    currency: options.currency || "usd",
    custom_fields: null,
    customer: options.customerId || generateCustomerId(),
    customer_address: null,
    customer_email: "tutor@example.com",
    customer_name: "Test Tutor",
    customer_phone: null,
    customer_shipping: null,
    customer_tax_exempt: "none",
    customer_tax_ids: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    discounts: [],
    due_date: null,
    effective_at: null,
    ending_balance: 0,
    footer: null,
    from_invoice: null,
    hosted_invoice_url: "https://invoice.stripe.com/test",
    invoice_pdf: null,
    issuer: null,
    last_finalization_error: null,
    latest_revision: null,
    lines: { object: "list", data: [], has_more: false, url: "/v1/invoices" },
    livemode: false,
    metadata: {},
    next_payment_attempt: options.nextPaymentAttempt ?? null,
    number: "INV-0001",
    on_behalf_of: null,
    paid: options.status === "paid",
    paid_out_of_band: false,
    payment_intent: generatePaymentIntentId(),
    payment_settings: {
      default_mandate: null,
      payment_method_options: null,
      payment_method_types: null,
    },
    period_end: Math.floor(Date.now() / 1000),
    period_start: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
    post_payment_credit_notes_amount: 0,
    pre_payment_credit_notes_amount: 0,
    quote: null,
    receipt_number: null,
    rendering: null,
    shipping_cost: null,
    shipping_details: null,
    starting_balance: 0,
    statement_descriptor: null,
    status: options.status || "open",
    status_transitions: {
      finalized_at: null,
      marked_uncollectible_at: null,
      paid_at: null,
      voided_at: null,
    },
    subscription: options.subscriptionId || null,
    subscription_details: options.subscriptionId
      ? { metadata: {}, subscription: options.subscriptionId }
      : null,
    subscription_proration_date: null,
    subtotal: options.amountDue || 3900,
    subtotal_excluding_tax: options.amountDue || 3900,
    tax: null,
    test_clock: null,
    total: options.amountDue || 3900,
    total_discount_amounts: null,
    total_excluding_tax: options.amountDue || 3900,
    total_tax_amounts: [],
    transfer_data: null,
    webhooks_delivered_at: null,
    // Add parent for new Stripe API
    parent: options.subscriptionId
      ? { subscription_details: { subscription: options.subscriptionId } }
      : null,
  } as unknown as Stripe.Invoice;
}

// ============================================
// PAYMENT INTENT MOCKS
// ============================================

export interface MockPaymentIntentOptions {
  id?: string;
  status?: Stripe.PaymentIntent.Status;
  amount?: number;
  currency?: string;
  customerId?: string;
  transferDestination?: string | null;
  applicationFeeAmount?: number | null;
  latestCharge?: string | null;
}

export function createMockPaymentIntent(
  options: MockPaymentIntentOptions = {}
): Stripe.PaymentIntent {
  return {
    id: options.id || generatePaymentIntentId(),
    object: "payment_intent",
    amount: options.amount || 5000,
    amount_capturable: 0,
    amount_details: { tip: {} },
    amount_received: options.status === "succeeded" ? (options.amount || 5000) : 0,
    application: null,
    application_fee_amount: options.applicationFeeAmount ?? null,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: "automatic",
    client_secret: generateStripeId("pi_secret"),
    confirmation_method: "automatic",
    created: Math.floor(Date.now() / 1000),
    currency: options.currency || "usd",
    customer: options.customerId || null,
    description: null,
    invoice: null,
    last_payment_error: null,
    latest_charge: options.latestCharge ?? generateStripeId("ch"),
    livemode: false,
    metadata: {},
    next_action: null,
    on_behalf_of: null,
    payment_method: generateStripeId("pm"),
    payment_method_configuration_details: null,
    payment_method_options: {},
    payment_method_types: ["card"],
    processing: null,
    receipt_email: null,
    review: null,
    setup_future_usage: null,
    shipping: null,
    source: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: options.status || "succeeded",
    transfer_data: options.transferDestination
      ? { destination: options.transferDestination }
      : null,
    transfer_group: null,
  } as unknown as Stripe.PaymentIntent;
}

// ============================================
// SUPABASE MOCK HELPERS
// ============================================

export type MockSupabaseResponse<T> = {
  data: T | null;
  error: { message: string; code: string } | null;
};

export function createMockSupabaseClient(
  responses: Record<string, MockSupabaseResponse<unknown>>
) {
  const mockChain = {
    select: () => mockChain,
    insert: () => mockChain,
    update: () => mockChain,
    delete: () => mockChain,
    upsert: () => mockChain,
    eq: () => mockChain,
    neq: () => mockChain,
    gte: () => mockChain,
    lte: () => mockChain,
    maybeSingle: () => Promise.resolve(responses.default || { data: null, error: null }),
    single: () => Promise.resolve(responses.default || { data: null, error: null }),
  };

  return {
    from: (table: string) => {
      const tableResponse = responses[table] || responses.default;
      return {
        ...mockChain,
        maybeSingle: () => Promise.resolve(tableResponse || { data: null, error: null }),
        single: () => Promise.resolve(tableResponse || { data: null, error: null }),
      };
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

// ============================================
// WEBHOOK SIGNATURE HELPERS
// ============================================

/**
 * Creates a mock signature for testing (NOT secure, for tests only)
 */
export function createMockWebhookSignature(
  payload: string,
  _secret: string,
  timestamp?: number
): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  // In real tests, you'd use stripe.webhooks.generateTestHeaderString()
  // This is a placeholder that mimics the format
  return `t=${ts},v1=mock_signature_for_testing`;
}

// ============================================
// EVENT FACTORIES FOR COMMON SCENARIOS
// ============================================

export const MockEvents = {
  checkoutSessionCompleted: {
    bookingPayment: (options: {
      bookingId: string;
      tutorId: string;
      amountTotal: number;
      paymentIntentId?: string;
    }) =>
      createMockStripeEvent({
        type: "checkout.session.completed",
        data: createMockCheckoutSession({
          paymentStatus: "paid",
          amountTotal: options.amountTotal,
          paymentIntent: options.paymentIntentId,
          metadata: {
            bookingId: options.bookingId,
            tutorId: options.tutorId,
          },
        }),
      }),

    platformSubscription: (options: {
      userId: string;
      plan: string;
      customerId: string;
    }) =>
      createMockStripeEvent({
        type: "checkout.session.completed",
        data: createMockCheckoutSession({
          mode: "subscription",
          customerId: options.customerId,
          metadata: {
            userId: options.userId,
            plan: options.plan,
          },
        }),
      }),

    lifetimePurchase: (options: { userId?: string; customerEmail?: string }) =>
      createMockStripeEvent({
        type: "checkout.session.completed",
        data: createMockCheckoutSession({
          mode: "payment",
          customerEmail: options.customerEmail,
          metadata: {
            ...(options.userId && { userId: options.userId }),
            plan: "tutor_life",
          },
        }),
      }),
  },

  subscriptionCreated: {
    platform: (options: { customerId: string; priceId: string; status?: Stripe.Subscription.Status }) =>
      createMockStripeEvent({
        type: "customer.subscription.created",
        data: createMockSubscription({
          customerId: options.customerId,
          priceId: options.priceId,
          status: options.status || "active",
        }),
      }),

    lessonSubscription: (options: {
      studentId: string;
      tutorId: string;
      templateId: string;
      customerId: string;
    }) =>
      createMockStripeEvent({
        type: "customer.subscription.created",
        data: createMockSubscription({
          customerId: options.customerId,
          metadata: {
            type: "lesson_subscription",
            studentId: options.studentId,
            tutorId: options.tutorId,
            templateId: options.templateId,
          },
        }),
      }),

    aiPractice: (options: {
      studentId: string;
      tutorId: string;
      isBlocksOnly?: boolean;
    }) =>
      createMockStripeEvent({
        type: "customer.subscription.created",
        data: createMockSubscription({
          metadata: {
            type: options.isBlocksOnly ? "ai_practice_blocks" : "ai_practice",
            studentId: options.studentId,
            tutorId: options.tutorId,
            ...(options.isBlocksOnly && { is_blocks_only: "true" }),
          },
        }),
      }),
  },

  subscriptionDeleted: {
    platform: (options: { customerId: string; subscriptionId?: string }) =>
      createMockStripeEvent({
        type: "customer.subscription.deleted",
        data: createMockSubscription({
          id: options.subscriptionId,
          customerId: options.customerId,
          status: "canceled",
        }),
      }),

    lessonSubscription: (options: { subscriptionId?: string }) =>
      createMockStripeEvent({
        type: "customer.subscription.deleted",
        data: createMockSubscription({
          id: options.subscriptionId,
          status: "canceled",
          metadata: { type: "lesson_subscription" },
        }),
      }),
  },

  invoicePaymentSucceeded: (options: {
    customerId: string;
    subscriptionId: string;
    amountPaid: number;
  }) =>
    createMockStripeEvent({
      type: "invoice.payment_succeeded",
      data: createMockInvoice({
        customerId: options.customerId,
        subscriptionId: options.subscriptionId,
        amountPaid: options.amountPaid,
        status: "paid",
      }),
    }),

  invoicePaymentFailed: (options: {
    customerId: string;
    subscriptionId: string;
    amountDue: number;
    nextPaymentAttempt?: number;
  }) =>
    createMockStripeEvent({
      type: "invoice.payment_failed",
      data: createMockInvoice({
        customerId: options.customerId,
        subscriptionId: options.subscriptionId,
        amountDue: options.amountDue,
        status: "open",
        nextPaymentAttempt: options.nextPaymentAttempt,
      }),
    }),

  accountUpdated: {
    onboardingCompleted: (accountId: string) =>
      createMockStripeEvent({
        type: "account.updated",
        data: createMockConnectAccount({
          id: accountId,
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
        }),
      }),

    requirementsDue: (accountId: string, requirements: string[]) =>
      createMockStripeEvent({
        type: "account.updated",
        data: createMockConnectAccount({
          id: accountId,
          chargesEnabled: false,
          payoutsEnabled: false,
          currentlyDue: requirements,
        }),
      }),

    restricted: (accountId: string, reason: string) =>
      createMockStripeEvent({
        type: "account.updated",
        data: createMockConnectAccount({
          id: accountId,
          chargesEnabled: false,
          payoutsEnabled: false,
          disabledReason: reason,
        }),
      }),
  },

  accountDeauthorized: (accountId: string) =>
    createMockStripeEvent({
      type: "account.application.deauthorized",
      data: { account: accountId } as unknown as Stripe.Event.Data.Object,
    }),
};
