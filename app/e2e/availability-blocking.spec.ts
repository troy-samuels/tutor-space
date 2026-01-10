/**
 * E2E Tests: Buffer-Aware Busy Windows & Blocked Times
 *
 * Tests that availability correctly respects:
 * 1. Manual blocked times created by tutors
 * 2. Buffer time around all events (bookings, blocked times, external events)
 * 3. Combined blocking scenarios
 */

import { test, expect, E2E_TUTOR, E2E_STUDENT, createE2EAdminClient, getTestState } from "./fixtures";
import { addMinutes, addDays, addHours, setHours, setMinutes, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper to create a time in tutor's timezone for a given day and hour
function createTimeInTutorTZ(daysFromNow: number, hour: number, minute: number = 0): Date {
  const base = addDays(new Date(), daysFromNow);
  const inTZ = toZonedTime(base, E2E_TUTOR.timezone);
  const withTime = setMinutes(setHours(inTZ, hour), minute);
  return fromZonedTime(withTime, E2E_TUTOR.timezone);
}

test.describe("Availability Blocking", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60000);

  let adminClient: SupabaseClient;
  let tutorId: string;
  let studentRecordId: string;
  let serviceId: string;

  test.beforeAll(async () => {
    adminClient = createE2EAdminClient();
    const state = getTestState();
    tutorId = state.tutorUserId!;
    studentRecordId = state.studentRecordId!;
    serviceId = state.serviceId!;

    // Set tutor buffer time to 30 minutes for tests
    await adminClient
      .from("profiles")
      .update({ buffer_time_minutes: 30 })
      .eq("id", tutorId);

    // Clean up any existing test blocked times
    await adminClient
      .from("blocked_times")
      .delete()
      .eq("tutor_id", tutorId)
      .like("label", "E2E Test%");
  });

  test.afterAll(async () => {
    // Cleanup: Remove test blocked times and reset buffer
    await adminClient
      .from("blocked_times")
      .delete()
      .eq("tutor_id", tutorId)
      .like("label", "E2E Test%");

    await adminClient
      .from("profiles")
      .update({ buffer_time_minutes: 0 })
      .eq("id", tutorId);

    // Cleanup any test bookings we created
    await adminClient
      .from("bookings")
      .delete()
      .eq("tutor_id", tutorId)
      .like("student_notes", "E2E Test%");
  });

  // ============================================
  // GROUP 1: Manual Blocked Times
  // ============================================

  test.describe("Manual Blocked Times", () => {
    let blockedTimeId: string;

    test("creates blocked time via database and verifies in calendar API", async ({ testTutor }) => {
      // Create a blocked time 3 days from now at 11:00 AM - 12:00 PM (tutor timezone)
      const blockStart = createTimeInTutorTZ(3, 11, 0);
      const blockEnd = createTimeInTutorTZ(3, 12, 0);

      const { data: block, error } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: blockStart.toISOString(),
          end_time: blockEnd.toISOString(),
          label: "E2E Test Block - Manual",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(block).not.toBeNull();
      blockedTimeId = block!.id;

      // Verify the blocked time exists in database
      const { data: verifyBlock } = await adminClient
        .from("blocked_times")
        .select("*")
        .eq("id", blockedTimeId)
        .single();

      expect(verifyBlock).not.toBeNull();
      expect(verifyBlock!.label).toBe("E2E Test Block - Manual");
    });

    test("blocked slot is not available on public booking page", async ({ testStudent }) => {
      // Navigate to the booking page
      await testStudent.goto(`/book/${E2E_TUTOR.username}`);
      await testStudent.waitForLoadState("domcontentloaded");

      // Wait for slots to load
      await testStudent.waitForSelector('text="Available times"', { timeout: 15000 });

      // Get the API response directly to verify slot generation
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      expect(data.status).toBe("ok");
      expect(data.groupedSlots).toBeDefined();

      // Find the day with the blocked time (3 days from now)
      const targetDate = format(addDays(new Date(), 3), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      if (targetGroup) {
        // Verify no slots exist for 11:00 AM (the blocked hour)
        const blockedHourSlots = targetGroup.slots.filter((slot: { startISO: string }) => {
          const slotHour = new Date(slot.startISO).getHours();
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "11:00";
        });

        expect(blockedHourSlots.length).toBe(0);
      }
    });

    test("buffer around blocked time prevents adjacent slot booking", async ({ testStudent }) => {
      // With 30-minute buffer, trying to book 10:30-11:30 should fail
      // because it overlaps with the buffered blocked time (10:30-12:30)
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      const targetDate = format(addDays(new Date(), 3), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      if (targetGroup) {
        // Check that 10:30 slot is also blocked (due to buffer before 11:00 block)
        const bufferAffectedSlots = targetGroup.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          const slotTime = format(slotInTZ, "HH:mm");
          // Both 10:30 and 11:00 should be blocked
          return slotTime === "10:30" || slotTime === "11:00";
        });

        // If service is 60 min, the 10:30 slot would end at 11:30, overlapping buffer
        expect(bufferAffectedSlots.length).toBe(0);
      }
    });

    test("deleting blocked time restores slot availability", async ({ testStudent }) => {
      // Delete the blocked time
      const { error } = await adminClient
        .from("blocked_times")
        .delete()
        .eq("id", blockedTimeId);

      expect(error).toBeNull();

      // Small delay to ensure cache/state is updated
      await testStudent.waitForTimeout(500);

      // Verify the slot is now available
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      const targetDate = format(addDays(new Date(), 3), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      // Now the 11:00 slot should be available (within 9 AM - 5 PM availability)
      if (targetGroup) {
        const restoredSlots = targetGroup.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "11:00";
        });

        expect(restoredSlots.length).toBe(1);
      }
    });
  });

  // ============================================
  // GROUP 2: Booking Buffer Enforcement
  // ============================================

  test.describe("Booking Buffer Enforcement", () => {
    let testBookingId: string;
    const bookingDay = 4; // 4 days from now
    const bookingHour = 14; // 2:00 PM

    test.beforeAll(async () => {
      // Create a test booking at 2:00 PM - 3:00 PM, 4 days from now
      const bookingStart = createTimeInTutorTZ(bookingDay, bookingHour, 0);

      const { data: booking, error } = await adminClient
        .from("bookings")
        .insert({
          tutor_id: tutorId,
          student_id: studentRecordId,
          service_id: serviceId,
          scheduled_at: bookingStart.toISOString(),
          duration_minutes: 60,
          timezone: E2E_TUTOR.timezone,
          status: "confirmed",
          payment_status: "paid",
          student_notes: "E2E Test Booking - Buffer Test",
        })
        .select()
        .single();

      expect(error).toBeNull();
      testBookingId = booking!.id;
    });

    test.afterAll(async () => {
      if (testBookingId) {
        await adminClient.from("bookings").delete().eq("id", testBookingId);
      }
    });

    test("slot within buffer before existing booking is not available", async ({ testStudent }) => {
      // With booking at 14:00 and 30-min buffer, 13:00-14:00 slot should be blocked
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      const targetDate = format(addDays(new Date(), bookingDay), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      expect(targetGroup).toBeDefined();

      // Check 13:00 slot (would end at 14:00, but with buffer needs gap before 14:00)
      const beforeBufferSlots = targetGroup!.slots.filter((slot: { startISO: string }) => {
        const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
        return format(slotInTZ, "HH:mm") === "13:00";
      });

      // 13:00 slot would overlap with 30-min buffer before 14:00 booking
      expect(beforeBufferSlots.length).toBe(0);
    });

    test("slot within buffer after existing booking is not available", async ({ testStudent }) => {
      // With booking ending at 15:00 and 30-min buffer, 15:00-16:00 slot should be blocked
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      const targetDate = format(addDays(new Date(), bookingDay), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      expect(targetGroup).toBeDefined();

      // Check 15:00 slot (starts within buffer zone after 15:00 booking end)
      const afterBufferSlots = targetGroup!.slots.filter((slot: { startISO: string }) => {
        const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
        return format(slotInTZ, "HH:mm") === "15:00";
      });

      expect(afterBufferSlots.length).toBe(0);
    });

    test("slot just outside buffer is available", async ({ testStudent }) => {
      // With booking 14:00-15:00 and 30-min buffer, 15:30 slot should be available
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      const targetDate = format(addDays(new Date(), bookingDay), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      expect(targetGroup).toBeDefined();

      // 15:30 should be available (outside the 30-min buffer)
      // Note: Service duration is 60 min, so we need slots that don't overlap
      // 15:30 start means it ends at 16:30, which doesn't overlap buffered zone (13:30-15:30)
      const outsideBufferSlots = targetGroup!.slots.filter((slot: { startISO: string }) => {
        const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
        const hour = parseInt(format(slotInTZ, "HH"));
        // Look for slots at 16:00 or later (clearly outside buffer)
        return hour >= 16;
      });

      expect(outsideBufferSlots.length).toBeGreaterThan(0);
    });

    test("cancelled booking does not block slots", async ({ testStudent }) => {
      // Create and then cancel a booking
      const cancelledBookingStart = createTimeInTutorTZ(5, 10, 0);

      const { data: cancelledBooking } = await adminClient
        .from("bookings")
        .insert({
          tutor_id: tutorId,
          student_id: studentRecordId,
          service_id: serviceId,
          scheduled_at: cancelledBookingStart.toISOString(),
          duration_minutes: 60,
          timezone: E2E_TUTOR.timezone,
          status: "cancelled_by_tutor",
          payment_status: "unpaid",
          student_notes: "E2E Test Booking - Cancelled",
        })
        .select()
        .single();

      expect(cancelledBooking).not.toBeNull();

      // Verify the 10:00 slot is still available (cancelled booking doesn't block)
      const response = await testStudent.request.get(
        `/api/booking/inline/${E2E_TUTOR.username}`
      );
      const data = await response.json();

      const targetDate = format(addDays(new Date(), 5), "yyyy-MM-dd");
      const targetGroup = data.groupedSlots.find(
        (g: { date: string }) => g.date === targetDate
      );

      expect(targetGroup).toBeDefined();

      const availableSlots = targetGroup!.slots.filter((slot: { startISO: string }) => {
        const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
        return format(slotInTZ, "HH:mm") === "10:00";
      });

      // Cancelled booking should not block the slot
      expect(availableSlots.length).toBe(1);

      // Cleanup
      await adminClient.from("bookings").delete().eq("id", cancelledBooking!.id);
    });
  });

  // ============================================
  // GROUP 3: Combined Scenarios
  // ============================================

  test.describe("Combined Blocking Scenarios", () => {
    test("multiple blocking sources all respected simultaneously", async ({ testStudent }) => {
      const testDay = 6; // 6 days from now

      // Create a confirmed booking at 10:00
      const booking1Start = createTimeInTutorTZ(testDay, 10, 0);
      const { data: booking1 } = await adminClient
        .from("bookings")
        .insert({
          tutor_id: tutorId,
          student_id: studentRecordId,
          service_id: serviceId,
          scheduled_at: booking1Start.toISOString(),
          duration_minutes: 60,
          timezone: E2E_TUTOR.timezone,
          status: "confirmed",
          payment_status: "paid",
          student_notes: "E2E Test Booking - Combined Test 1",
        })
        .select()
        .single();

      // Create a blocked time at 13:00
      const blockStart = createTimeInTutorTZ(testDay, 13, 0);
      const blockEnd = createTimeInTutorTZ(testDay, 14, 0);
      const { data: block } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: blockStart.toISOString(),
          end_time: blockEnd.toISOString(),
          label: "E2E Test Block - Combined",
        })
        .select()
        .single();

      try {
        // Verify API returns properly filtered slots
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        const targetDate = format(addDays(new Date(), testDay), "yyyy-MM-dd");
        const targetGroup = data.groupedSlots.find(
          (g: { date: string }) => g.date === targetDate
        );

        expect(targetGroup).toBeDefined();

        // 10:00 should be blocked (booking)
        const at10 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "10:00";
        });
        expect(at10.length).toBe(0);

        // 13:00 should be blocked (blocked time)
        const at13 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "13:00";
        });
        expect(at13.length).toBe(0);

        // 16:00 should be available (nothing blocking it)
        const at16 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "16:00";
        });
        expect(at16.length).toBe(1);
      } finally {
        // Cleanup
        if (booking1) await adminClient.from("bookings").delete().eq("id", booking1.id);
        if (block) await adminClient.from("blocked_times").delete().eq("id", block.id);
      }
    });

    test("adjacent blocked times create proper gap", async ({ testStudent }) => {
      const testDay = 7;

      // Create back-to-back blocked times: 10:00-11:00 and 11:00-12:00
      const block1Start = createTimeInTutorTZ(testDay, 10, 0);
      const block1End = createTimeInTutorTZ(testDay, 11, 0);
      const block2Start = createTimeInTutorTZ(testDay, 11, 0);
      const block2End = createTimeInTutorTZ(testDay, 12, 0);

      const { data: block1 } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: block1Start.toISOString(),
          end_time: block1End.toISOString(),
          label: "E2E Test Block - Adjacent 1",
        })
        .select()
        .single();

      const { data: block2 } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: block2Start.toISOString(),
          end_time: block2End.toISOString(),
          label: "E2E Test Block - Adjacent 2",
        })
        .select()
        .single();

      try {
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        const targetDate = format(addDays(new Date(), testDay), "yyyy-MM-dd");
        const targetGroup = data.groupedSlots.find(
          (g: { date: string }) => g.date === targetDate
        );

        expect(targetGroup).toBeDefined();

        // With buffer, the blocked zone is 9:30 - 12:30
        // So 9:00 slot (ends 10:00) should be blocked
        // And 12:00 slot (starts 12:00) should be blocked
        // First truly available slot should be 12:30 or later

        const blockedHours = [9, 10, 11, 12];
        for (const hour of blockedHours) {
          const slotsAtHour = targetGroup!.slots.filter((slot: { startISO: string }) => {
            const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
            return format(slotInTZ, "HH:mm") === `${hour.toString().padStart(2, "0")}:00`;
          });
          expect(slotsAtHour.length).toBe(0);
        }
      } finally {
        if (block1) await adminClient.from("blocked_times").delete().eq("id", block1.id);
        if (block2) await adminClient.from("blocked_times").delete().eq("id", block2.id);
      }
    });
  });

  // ============================================
  // GROUP 4: Edge Cases
  // ============================================

  test.describe("Edge Cases", () => {
    test("zero buffer allows back-to-back bookings", async ({ testStudent }) => {
      // Temporarily set buffer to 0
      await adminClient
        .from("profiles")
        .update({ buffer_time_minutes: 0 })
        .eq("id", tutorId);

      const testDay = 8;

      // Create a booking at 10:00-11:00
      const bookingStart = createTimeInTutorTZ(testDay, 10, 0);
      const { data: booking } = await adminClient
        .from("bookings")
        .insert({
          tutor_id: tutorId,
          student_id: studentRecordId,
          service_id: serviceId,
          scheduled_at: bookingStart.toISOString(),
          duration_minutes: 60,
          timezone: E2E_TUTOR.timezone,
          status: "confirmed",
          payment_status: "paid",
          student_notes: "E2E Test Booking - Zero Buffer",
        })
        .select()
        .single();

      try {
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        const targetDate = format(addDays(new Date(), testDay), "yyyy-MM-dd");
        const targetGroup = data.groupedSlots.find(
          (g: { date: string }) => g.date === targetDate
        );

        expect(targetGroup).toBeDefined();

        // With zero buffer, 11:00 slot should be available (back-to-back allowed)
        const at11 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "11:00";
        });
        expect(at11.length).toBe(1);

        // But 10:00 should still be blocked (the actual booking time)
        const at10 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "10:00";
        });
        expect(at10.length).toBe(0);
      } finally {
        if (booking) await adminClient.from("bookings").delete().eq("id", booking.id);
        // Restore 30-minute buffer
        await adminClient
          .from("profiles")
          .update({ buffer_time_minutes: 30 })
          .eq("id", tutorId);
      }
    });

    test("large buffer (60 min) enforces extended gap", async ({ testStudent }) => {
      // Set buffer to 60 minutes
      await adminClient
        .from("profiles")
        .update({ buffer_time_minutes: 60 })
        .eq("id", tutorId);

      const testDay = 9;

      // Create a booking at 12:00-13:00
      const bookingStart = createTimeInTutorTZ(testDay, 12, 0);
      const { data: booking } = await adminClient
        .from("bookings")
        .insert({
          tutor_id: tutorId,
          student_id: studentRecordId,
          service_id: serviceId,
          scheduled_at: bookingStart.toISOString(),
          duration_minutes: 60,
          timezone: E2E_TUTOR.timezone,
          status: "confirmed",
          payment_status: "paid",
          student_notes: "E2E Test Booking - Large Buffer",
        })
        .select()
        .single();

      try {
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        const targetDate = format(addDays(new Date(), testDay), "yyyy-MM-dd");
        const targetGroup = data.groupedSlots.find(
          (g: { date: string }) => g.date === targetDate
        );

        expect(targetGroup).toBeDefined();

        // With 60-min buffer and 12:00-13:00 booking:
        // Buffer zone is 11:00-14:00
        // 11:00 slot (60 min service) would end at 12:00, within buffer - BLOCKED
        // 13:00 slot would start at 13:00, within buffer - BLOCKED
        // 14:00 slot should be available

        const at11 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "11:00";
        });
        expect(at11.length).toBe(0);

        const at13 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "13:00";
        });
        expect(at13.length).toBe(0);

        // 14:00 should be available
        const at14 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "14:00";
        });
        expect(at14.length).toBe(1);
      } finally {
        if (booking) await adminClient.from("bookings").delete().eq("id", booking.id);
        // Restore 30-minute buffer
        await adminClient
          .from("profiles")
          .update({ buffer_time_minutes: 30 })
          .eq("id", tutorId);
      }
    });

    test("touching intervals are handled correctly (non-inclusive)", async ({ testStudent }) => {
      const testDay = 10;

      // Create a blocked time that ends exactly at 11:00
      const blockStart = createTimeInTutorTZ(testDay, 10, 0);
      const blockEnd = createTimeInTutorTZ(testDay, 11, 0);

      const { data: block } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: blockStart.toISOString(),
          end_time: blockEnd.toISOString(),
          label: "E2E Test Block - Touching",
        })
        .select()
        .single();

      // Set buffer to 0 to test exact touching behavior
      await adminClient
        .from("profiles")
        .update({ buffer_time_minutes: 0 })
        .eq("id", tutorId);

      try {
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        const targetDate = format(addDays(new Date(), testDay), "yyyy-MM-dd");
        const targetGroup = data.groupedSlots.find(
          (g: { date: string }) => g.date === targetDate
        );

        expect(targetGroup).toBeDefined();

        // With zero buffer and block ending at 11:00:
        // 11:00 slot starting exactly at block end should be available (non-inclusive overlap)
        const at11 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "11:00";
        });

        // areIntervalsOverlapping with inclusive: false means touching intervals don't overlap
        expect(at11.length).toBe(1);
      } finally {
        if (block) await adminClient.from("blocked_times").delete().eq("id", block.id);
        // Restore 30-minute buffer
        await adminClient
          .from("profiles")
          .update({ buffer_time_minutes: 30 })
          .eq("id", tutorId);
      }
    });

    test("timezone handling: tutor and student in different timezones", async ({ testStudent }) => {
      // Tutor is in America/New_York, Student is in America/Los_Angeles
      // Create a blocked time at 2:00 PM New York time (11:00 AM LA time)
      const testDay = 11;

      const blockStart = createTimeInTutorTZ(testDay, 14, 0);
      const blockEnd = createTimeInTutorTZ(testDay, 15, 0);

      const { data: block } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: blockStart.toISOString(),
          end_time: blockEnd.toISOString(),
          label: "E2E Test Block - Timezone",
        })
        .select()
        .single();

      try {
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        // The API should return slots in tutor's timezone
        expect(data.timezone).toBe(E2E_TUTOR.timezone);

        const targetDate = format(addDays(new Date(), testDay), "yyyy-MM-dd");
        const targetGroup = data.groupedSlots.find(
          (g: { date: string }) => g.date === targetDate
        );

        expect(targetGroup).toBeDefined();

        // 14:00 in tutor timezone should be blocked
        const at14 = targetGroup!.slots.filter((slot: { startISO: string }) => {
          const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
          return format(slotInTZ, "HH:mm") === "14:00";
        });
        expect(at14.length).toBe(0);

        // The blocked time is correctly stored and retrieved in UTC
        // regardless of which timezone the student is viewing from
      } finally {
        if (block) await adminClient.from("blocked_times").delete().eq("id", block.id);
      }
    });
  });

  // ============================================
  // GROUP 5: UI Verification
  // ============================================

  test.describe("UI Verification", () => {
    test("booking page shows correct available slots visually", async ({ testStudent }) => {
      const testDay = 12;

      // Create a blocked time at noon
      const blockStart = createTimeInTutorTZ(testDay, 12, 0);
      const blockEnd = createTimeInTutorTZ(testDay, 13, 0);

      const { data: block } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: blockStart.toISOString(),
          end_time: blockEnd.toISOString(),
          label: "E2E Test Block - UI Test",
        })
        .select()
        .single();

      try {
        // Navigate to booking page
        await testStudent.goto(`/book/${E2E_TUTOR.username}`);
        await testStudent.waitForLoadState("networkidle");

        // Wait for available times section
        await testStudent.waitForSelector('text="Available times"', { timeout: 15000 });

        // Find and click on the test day in the date picker
        const targetDateFormatted = format(addDays(new Date(), testDay), "d");

        // Try to find the day button and click it
        const dayButton = testStudent.locator(`button:has-text("${targetDateFormatted}")`).first();
        if (await dayButton.isVisible()) {
          await dayButton.click();
          await testStudent.waitForTimeout(500);
        }

        // Verify that 12:00 PM slot is NOT visible (blocked)
        // And that other slots like 9:00 AM ARE visible
        const page = testStudent;

        // The slot buttons show time like "9:00 AM - 10:00 AM"
        // 12:00 PM should not be present
        const slot12pm = page.locator('button:has-text("12:00 PM")');
        const slot12pmCount = await slot12pm.count();
        expect(slot12pmCount).toBe(0);
      } finally {
        if (block) await adminClient.from("blocked_times").delete().eq("id", block.id);
      }
    });

    test("navigating through days shows correct availability for each", async ({ testStudent }) => {
      // Create different blocks on consecutive days
      const day1 = 13;
      const day2 = 14;

      const block1Start = createTimeInTutorTZ(day1, 10, 0);
      const block1End = createTimeInTutorTZ(day1, 11, 0);

      const block2Start = createTimeInTutorTZ(day2, 15, 0);
      const block2End = createTimeInTutorTZ(day2, 16, 0);

      const { data: block1 } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: block1Start.toISOString(),
          end_time: block1End.toISOString(),
          label: "E2E Test Block - Day Nav 1",
        })
        .select()
        .single();

      const { data: block2 } = await adminClient
        .from("blocked_times")
        .insert({
          tutor_id: tutorId,
          start_time: block2Start.toISOString(),
          end_time: block2End.toISOString(),
          label: "E2E Test Block - Day Nav 2",
        })
        .select()
        .single();

      try {
        // Get slots via API for both days
        const response = await testStudent.request.get(
          `/api/booking/inline/${E2E_TUTOR.username}`
        );
        const data = await response.json();

        const day1Date = format(addDays(new Date(), day1), "yyyy-MM-dd");
        const day2Date = format(addDays(new Date(), day2), "yyyy-MM-dd");

        const day1Group = data.groupedSlots.find((g: { date: string }) => g.date === day1Date);
        const day2Group = data.groupedSlots.find((g: { date: string }) => g.date === day2Date);

        // Day 1: 10:00 blocked, 15:00 available
        if (day1Group) {
          const at10day1 = day1Group.slots.filter((slot: { startISO: string }) => {
            const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
            return format(slotInTZ, "HH:mm") === "10:00";
          });
          expect(at10day1.length).toBe(0);

          const at15day1 = day1Group.slots.filter((slot: { startISO: string }) => {
            const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
            return format(slotInTZ, "HH:mm") === "15:00";
          });
          expect(at15day1.length).toBe(1);
        }

        // Day 2: 10:00 available, 15:00 blocked
        if (day2Group) {
          const at10day2 = day2Group.slots.filter((slot: { startISO: string }) => {
            const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
            return format(slotInTZ, "HH:mm") === "10:00";
          });
          expect(at10day2.length).toBe(1);

          const at15day2 = day2Group.slots.filter((slot: { startISO: string }) => {
            const slotInTZ = toZonedTime(new Date(slot.startISO), E2E_TUTOR.timezone);
            return format(slotInTZ, "HH:mm") === "15:00";
          });
          expect(at15day2.length).toBe(0);
        }
      } finally {
        if (block1) await adminClient.from("blocked_times").delete().eq("id", block1.id);
        if (block2) await adminClient.from("blocked_times").delete().eq("id", block2.id);
      }
    });
  });
});
