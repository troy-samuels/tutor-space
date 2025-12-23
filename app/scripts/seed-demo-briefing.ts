/**
 * Seed script to create demo briefing data for development
 * Run with: npx tsx scripts/seed-demo-briefing.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration - change this to your tutor ID
const TUTOR_EMAIL = "troy@blairandbowers.com";

async function seedDemoBriefing() {
  console.log("Starting demo briefing seed...\n");

  // 1. Get tutor profile
  const { data: tutor, error: tutorError } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("email", TUTOR_EMAIL)
    .single();

  if (tutorError || !tutor) {
    console.error("Could not find tutor:", tutorError);
    process.exit(1);
  }
  console.log(`Found tutor: ${tutor.full_name} (${tutor.id})`);

  // 2. Get or create a test student
  let studentId: string;
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("tutor_id", tutor.id)
    .eq("email", "maria.demo@tutorlingua.test")
    .maybeSingle();

  if (existingStudent) {
    studentId = existingStudent.id;
    console.log(`Using existing student: ${studentId}`);
  } else {
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        tutor_id: tutor.id,
        full_name: "Maria Garcia",
        email: "maria.demo@tutorlingua.test",
      })
      .select("id")
      .single();

    if (studentError || !newStudent) {
      console.error("Could not create student:", studentError);
      process.exit(1);
    }
    studentId = newStudent.id;
    console.log(`Created new student: ${studentId}`);
  }

  // 3. Get tutor's first service
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, duration_minutes")
    .eq("tutor_id", tutor.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (serviceError || !service) {
    console.error("Could not find service:", serviceError);
    process.exit(1);
  }
  console.log(`Using service: ${service.name} (${service.id})`);

  // 4. Create a booking for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

  // Check for existing booking
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("tutor_id", tutor.id)
    .eq("student_id", studentId)
    .gte("scheduled_at", new Date().toISOString())
    .maybeSingle();

  let bookingId: string;
  if (existingBooking) {
    bookingId = existingBooking.id;
    console.log(`Using existing booking: ${bookingId}`);
  } else {
    const { data: newBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        tutor_id: tutor.id,
        student_id: studentId,
        service_id: service.id,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: service.duration_minutes || 60,
        status: "confirmed",
        payment_status: "paid",
        timezone: "America/New_York",
      })
      .select("id")
      .single();

    if (bookingError || !newBooking) {
      console.error("Could not create booking:", bookingError);
      process.exit(1);
    }
    bookingId = newBooking.id;
    console.log(`Created booking: ${bookingId}`);
  }

  // 5. Create the lesson briefing
  const briefingData = {
    tutor_id: tutor.id,
    student_id: studentId,
    booking_id: bookingId,
    student_summary: "Maria is an intermediate English learner from Spain. She's preparing for a business English certification and has been working on improving her professional vocabulary and presentation skills.",
    focus_areas: [
      {
        type: "grammar",
        topic: "Conditional sentences (Type 2 & 3)",
        reason: "Struggled with hypothetical situations in last session",
        evidence: "Made 4 errors with 'would have' constructions",
      },
      {
        type: "vocabulary",
        topic: "Business negotiation phrases",
        reason: "Requested focus area for certification prep",
        evidence: "Expanding professional lexicon",
      },
    ],
    error_patterns: [
      {
        type: "Article usage",
        count: 6,
        examples: ["She went to the university", "I need an advice"],
        severity: "medium",
      },
      {
        type: "Conditional mood",
        count: 4,
        examples: ["If I would know...", "I wish I can..."],
        severity: "high",
      },
      {
        type: "Preposition choice",
        count: 3,
        examples: ["Depend of", "Interested on"],
        severity: "low",
      },
    ],
    suggested_activities: [
      {
        title: "Conditional Chain Story",
        description: "Take turns building a story using Type 2 conditionals. Each person adds a 'If I [did X], I would [Y]' sentence.",
        duration_min: 15,
      },
      {
        title: "Business Scenario Role-play",
        description: "Practice a salary negotiation conversation using target phrases: 'I would propose...', 'If we could agree on...'",
        duration_min: 20,
      },
      {
        title: "Error Correction Sprint",
        description: "Quick-fire correction of common article mistakes from previous sessions.",
        duration_min: 10,
      },
    ],
    sr_items_due: 7,
    sr_items_preview: [
      { word: "Nevertheless", type: "connector", last_reviewed: "2025-12-20" },
      { word: "To leverage", type: "verb", last_reviewed: "2025-12-19" },
      { word: "Stakeholder", type: "noun", last_reviewed: "2025-12-18" },
    ],
    goal_progress: {
      goal_text: "Pass Business English Certificate (BEC Higher)",
      progress_pct: 65,
      target_date: "2026-03-15",
    },
    engagement_trend: "stable",
    engagement_signals: [
      { type: "speaking_ratio", value: 62, concern: false },
      { type: "response_latency", value: "normal", concern: false },
    ],
    lessons_analyzed: 8,
    last_lesson_summary: "Covered presentation openings and transitions. Maria showed good progress with signposting language but needs more practice with conditional structures for hypothetical scenarios.",
    last_lesson_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    proficiency_level: "B2",
    native_language: "Spanish",
    target_language: "English",
  };

  // Check for existing briefing
  const { data: existingBriefing } = await supabase
    .from("lesson_briefings")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingBriefing) {
    // Update existing
    const { error: updateError } = await supabase
      .from("lesson_briefings")
      .update(briefingData)
      .eq("id", existingBriefing.id);

    if (updateError) {
      console.error("Could not update briefing:", updateError);
      process.exit(1);
    }
    console.log(`Updated existing briefing: ${existingBriefing.id}`);
  } else {
    // Create new
    const { data: newBriefing, error: briefingError } = await supabase
      .from("lesson_briefings")
      .insert(briefingData)
      .select("id")
      .single();

    if (briefingError || !newBriefing) {
      console.error("Could not create briefing:", briefingError);
      process.exit(1);
    }
    console.log(`Created briefing: ${newBriefing.id}`);
  }

  console.log("\n✅ Demo briefing seed complete!");
  console.log(`\nView at: http://localhost:3000/dashboard`);
  console.log(`Direct briefing URL: http://localhost:3000/copilot/briefing/${bookingId}`);
}

seedDemoBriefing().catch(console.error);
