import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  generatePracticeDeepLink,
  generateShareableResultLink,
  generateChallengeLink,
  generateTutorReferralLink,
} from "@/lib/practice/deep-links";

// ─── Deep Link Generation ────────────────────────────────────────

describe("deep-links", () => {
  describe("generatePracticeDeepLink", () => {
    it("produces a valid practice start URL with ref param", () => {
      const link = generatePracticeDeepLink({
        assignmentId: "abc-123",
        tutorUsername: "marco",
      });

      assert.ok(link.includes("/practice/start/abc-123"), "should contain assignment path");
      assert.ok(link.includes("ref=marco"), "should include tutor ref param");
    });

    it("includes student name when provided", () => {
      const link = generatePracticeDeepLink({
        assignmentId: "abc-123",
        tutorUsername: "marco",
        studentName: "Elena",
      });

      assert.ok(link.includes("student=Elena"), "should include student param");
    });

    it("URL-encodes special characters in assignment id", () => {
      const link = generatePracticeDeepLink({
        assignmentId: "a b/c",
        tutorUsername: "marco",
      });

      assert.ok(!link.includes(" "), "spaces should be encoded");
      assert.ok(link.includes("a%20b"), "should URL-encode spaces");
    });
  });

  describe("generateShareableResultLink", () => {
    it("produces a valid result URL", () => {
      const link = generateShareableResultLink({
        sessionId: "session-456",
        language: "es",
        score: 78,
        level: "B1",
      });

      assert.ok(link.includes("/practice/result/session-456"), "should contain result path");
    });
  });

  describe("generateChallengeLink", () => {
    it("produces a valid challenge URL with query params", () => {
      const link = generateChallengeLink({
        challengerId: "challenger-789",
        language: "fr",
        level: "A2",
        score: 65,
      });

      assert.ok(link.includes("/practice/challenge/challenger-789"), "should contain challenge path");
      assert.ok(link.includes("lang=fr"), "should include language param");
      assert.ok(link.includes("level=A2"), "should include level param");
    });
  });

  describe("generateTutorReferralLink", () => {
    it("produces a valid referral URL", () => {
      const link = generateTutorReferralLink({
        tutorId: "tutor-001",
        tutorUsername: "sarah_teaches",
      });

      assert.ok(link.includes("/join/tutor-ref/sarah_teaches"), "should contain referral path");
    });
  });

  describe("all links use consistent base URL", () => {
    it("all links start with https://", () => {
      const links = [
        generatePracticeDeepLink({ assignmentId: "a", tutorUsername: "t" }),
        generateShareableResultLink({ sessionId: "s", language: "es", score: 50, level: "A1" }),
        generateChallengeLink({ challengerId: "c", language: "de", level: "B2", score: 80 }),
        generateTutorReferralLink({ tutorId: "id", tutorUsername: "u" }),
      ];

      for (const link of links) {
        assert.ok(link.startsWith("https://"), `link should be HTTPS: ${link}`);
      }
    });
  });
});

// ─── Attribution Cookie (unit-testable parts) ────────────────────

describe("attribution", () => {
  // Attribution relies on document.cookie which isn't available in Node.
  // We test the module exports exist and types are correct.

  it("module exports the expected functions", async () => {
    // Dynamic import to verify the module resolves
    const mod = await import("@/lib/practice/attribution");

    assert.ok(typeof mod.setAttributionCookie === "function", "setAttributionCookie should be exported");
    assert.ok(typeof mod.getAttributionCookie === "function", "getAttributionCookie should be exported");
    assert.ok(typeof mod.clearAttributionCookie === "function", "clearAttributionCookie should be exported");
  });
});

// ─── Unified Assignment ──────────────────────────────────────────

describe("unified-assignment", () => {
  it("module exports resolve correctly", async () => {
    const mod = await import("@/lib/practice/unified-assignment");

    // Check the module has meaningful exports
    const exportNames = Object.keys(mod);
    assert.ok(exportNames.length > 0, "should have at least one export");
  });
});

// ─── Virality Store ──────────────────────────────────────────────

describe("virality-store", () => {
  it("module exports resolve correctly", async () => {
    const mod = await import("@/lib/practice/virality-store");

    const exportNames = Object.keys(mod);
    assert.ok(exportNames.length > 0, "should have at least one export");
  });
});

// ─── Referrals ───────────────────────────────────────────────────

describe("referrals", () => {
  it("module exports the expected server actions", async () => {
    const mod = await import("@/lib/actions/referrals");

    const exportNames = Object.keys(mod);
    assert.ok(exportNames.length > 0, "should have at least one export");

    // Check for expected function names (may vary based on implementation)
    for (const name of exportNames) {
      assert.ok(
        typeof (mod as Record<string, unknown>)[name] === "function",
        `export '${name}' should be a function`
      );
    }
  });
});
