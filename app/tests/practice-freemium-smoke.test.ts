import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStudentPracticeAccess } from "@/lib/practice/access";
import {
  BASIC_SESSIONS_PER_MONTH,
  FREE_SESSIONS_PER_MONTH,
  SOLO_PRICE_CENTS,
  UNLIMITED_PRICE_CENTS,
} from "@/lib/practice/constants";
import { resolveCheckoutPlan } from "@/lib/practice/checkout-plans";

type MockStudentRow = {
  id: string;
  tutor_id?: string | null;
  practice_tier?: string | null;
  practice_subscription_id?: string | null;
  ai_practice_subscription_id?: string | null;
  ai_practice_block_subscription_item_id?: string | null;
  profiles?: {
    id?: string | null;
    full_name?: string | null;
    tier?: string | null;
    plan?: string | null;
  } | null;
};

/**
 * Creates a minimal Supabase mock for `getStudentPracticeAccess` tests.
 */
function createStudentAccessMock(studentRows: Record<string, MockStudentRow>): SupabaseClient {
  let targetStudentId: string | null = null;

  const queryBuilder = {
    select() {
      return queryBuilder;
    },
    eq(column: string, value: string) {
      if (column === "id") {
        targetStudentId = value;
      }
      return queryBuilder;
    },
    async maybeSingle() {
      if (!targetStudentId) {
        return { data: null, error: null };
      }
      return {
        data: (studentRows[targetStudentId] ?? null) as unknown,
        error: null,
      };
    },
  };

  const client = {
    from(table: string) {
      if (table !== "students") {
        throw new Error(`Unexpected table: ${table}`);
      }
      return queryBuilder;
    },
  };

  return client as unknown as SupabaseClient;
}

/**
 * Evaluates whether another session can start for a tier allowance.
 */
function canStartSession(sessionsUsed: number, allowance: number): boolean {
  return allowance === -1 || sessionsUsed < allowance;
}

describe("Practice Tier Access", () => {
  it("free tier allows 3 sessions and blocks the 4th with upgrade data", async () => {
    const supabase = createStudentAccessMock({
      "student-free": {
        id: "student-free",
        tutor_id: "tutor-free",
        profiles: {
          id: "tutor-free",
          tier: "standard",
          plan: "professional",
          full_name: "Tutor Free",
        },
      },
    });

    const access = await getStudentPracticeAccess(supabase, "student-free");
    assert.equal(access.hasAccess, true);
    if (!access.hasAccess) {
      throw new Error("Expected granted access");
    }

    assert.equal(access.tier, "free");
    assert.equal(access.sessionsPerMonth, FREE_SESSIONS_PER_MONTH);
    assert.equal(access.audioEnabled, false);
    assert.equal(access.adaptiveEnabled, false);
    assert.equal(access.voiceInputEnabled, false);
    assert.equal(access.showUpgradePrompt, true);
    assert.equal(access.upgradePrice, UNLIMITED_PRICE_CENTS);
    assert.equal(canStartSession(0, access.sessionsPerMonth), true);
    assert.equal(canStartSession(2, access.sessionsPerMonth), true);
    assert.equal(canStartSession(3, access.sessionsPerMonth), false);
  });

  it("basic tier allows 10 sessions for tutor-linked students on Pro/Studio", async () => {
    const supabase = createStudentAccessMock({
      "student-basic": {
        id: "student-basic",
        tutor_id: "tutor-pro",
        profiles: {
          id: "tutor-pro",
          tier: "standard",
          plan: "pro_monthly",
          full_name: "Tutor Pro",
        },
      },
    });

    const access = await getStudentPracticeAccess(supabase, "student-basic");
    assert.equal(access.hasAccess, true);
    if (!access.hasAccess) {
      throw new Error("Expected granted access");
    }

    assert.equal(access.tier, "basic");
    assert.equal(access.sessionsPerMonth, BASIC_SESSIONS_PER_MONTH);
    assert.equal(access.audioEnabled, false);
    assert.equal(access.adaptiveEnabled, false);
    assert.equal(access.voiceInputEnabled, false);
    assert.equal(canStartSession(9, access.sessionsPerMonth), true);
    assert.equal(canStartSession(10, access.sessionsPerMonth), false);
  });

  it("unlimited tier has no session cap", async () => {
    const supabase = createStudentAccessMock({
      "student-unlimited": {
        id: "student-unlimited",
        tutor_id: "tutor-any",
        practice_tier: "unlimited",
        practice_subscription_id: "sub_123",
        profiles: {
          id: "tutor-any",
          tier: "standard",
          plan: "professional",
        },
      },
    });

    const access = await getStudentPracticeAccess(supabase, "student-unlimited");
    assert.equal(access.hasAccess, true);
    if (!access.hasAccess) {
      throw new Error("Expected granted access");
    }

    assert.equal(access.tier, "unlimited");
    assert.equal(access.sessionsPerMonth, -1);
    assert.equal(access.audioEnabled, true);
    assert.equal(access.adaptiveEnabled, true);
    assert.equal(access.voiceInputEnabled, true);
    assert.equal(canStartSession(9999, access.sessionsPerMonth), true);
  });

  it("solo tier has no session cap", async () => {
    const supabase = createStudentAccessMock({
      "student-solo": {
        id: "student-solo",
        tutor_id: null,
        practice_tier: "solo",
        practice_subscription_id: "sub_456",
      },
    });

    const access = await getStudentPracticeAccess(supabase, "student-solo");
    assert.equal(access.hasAccess, true);
    if (!access.hasAccess) {
      throw new Error("Expected granted access");
    }

    assert.equal(access.tier, "solo");
    assert.equal(access.sessionsPerMonth, -1);
    assert.equal(access.audioEnabled, true);
    assert.equal(access.adaptiveEnabled, true);
    assert.equal(access.voiceInputEnabled, true);
    assert.equal(canStartSession(9999, access.sessionsPerMonth), true);
  });

  it("legacy block/base subscriptions map to unlimited tier", async () => {
    const supabase = createStudentAccessMock({
      "student-legacy": {
        id: "student-legacy",
        tutor_id: "tutor-legacy",
        ai_practice_subscription_id: "legacy_sub",
        ai_practice_block_subscription_item_id: "si_legacy",
        profiles: {
          id: "tutor-legacy",
          tier: "standard",
          plan: "professional",
        },
      },
    });

    const access = await getStudentPracticeAccess(supabase, "student-legacy");
    assert.equal(access.hasAccess, true);
    if (!access.hasAccess) {
      throw new Error("Expected granted access");
    }

    assert.equal(access.tier, "unlimited");
  });

  it("access works without Studio gate (Pro tutor grants basic tier)", async () => {
    const supabase = createStudentAccessMock({
      "student-pro": {
        id: "student-pro",
        tutor_id: "tutor-pro",
        profiles: {
          id: "tutor-pro",
          tier: "standard",
          plan: "pro_annual",
        },
      },
    });

    const access = await getStudentPracticeAccess(supabase, "student-pro");
    assert.equal(access.hasAccess, true);
    if (!access.hasAccess) {
      throw new Error("Expected granted access");
    }
    assert.equal(access.tier, "basic");
  });
});

describe("Practice Checkout Routing", () => {
  it("routes tutor-linked students to $4.99 Unlimited checkout", () => {
    const plan = resolveCheckoutPlan("tutor-1");
    assert.equal(plan.subscription, "unlimited");
    assert.equal(plan.priceCents, UNLIMITED_PRICE_CENTS);
  });

  it("routes solo students to $9.99 Solo checkout", () => {
    const plan = resolveCheckoutPlan(null);
    assert.equal(plan.subscription, "solo");
    assert.equal(plan.priceCents, SOLO_PRICE_CENTS);
  });
});
