/**
 * Seed script to create demo AI Practice & Homework data for development
 * Run with: npx tsx scripts/seed-ai-practice-homework.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration - change this to your tutor email
const TUTOR_EMAIL = "troy@blairandbowers.com";

async function seedAIPracticeHomework() {
  console.log("Starting AI Practice & Homework seed...\n");

  // 1. Get tutor profile
  const { data: tutor, error: tutorError } = await supabase
    .from("profiles")
    .select("id, full_name, username, tier")
    .eq("email", TUTOR_EMAIL)
    .single();

  if (tutorError || !tutor) {
    console.error("Could not find tutor:", tutorError);
    console.log("\nPlease ensure you have a tutor account with email:", TUTOR_EMAIL);
    process.exit(1);
  }
  console.log(`Found tutor: ${tutor.full_name} (${tutor.id})`);
  console.log(`Tier: ${tutor.tier || "standard"}`);

  // Ensure tutor has Studio tier for AI Practice access
  if (tutor.tier !== "studio") {
    console.log("Updating tutor to Studio tier for AI Practice access...");
    await supabase
      .from("profiles")
      .update({ tier: "studio" })
      .eq("id", tutor.id);
  }

  // 2. Get or create a demo student
  let studentId: string;
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("tutor_id", tutor.id)
    .eq("email", "carlos.practice@tutorlingua.test")
    .maybeSingle();

  if (existingStudent) {
    studentId = existingStudent.id;
    console.log(`Using existing student: ${studentId}`);

    // Try to update AI Practice fields if they exist
    try {
      await supabase
        .from("students")
        .update({
          ai_practice_enabled: true,
        })
        .eq("id", studentId);
    } catch {
      // Fields may not exist, continue
    }
  } else {
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        tutor_id: tutor.id,
        full_name: "Carlos Martinez",
        email: "carlos.practice@tutorlingua.test",
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

  // 3. Create Practice Scenario
  let scenarioId: string;
  const { data: existingScenario } = await supabase
    .from("practice_scenarios")
    .select("id")
    .eq("tutor_id", tutor.id)
    .eq("title", "Restaurant Ordering in Spanish")
    .maybeSingle();

  if (existingScenario) {
    scenarioId = existingScenario.id;
    console.log(`Using existing scenario: ${scenarioId}`);
  } else {
    const { data: newScenario, error: scenarioError } = await supabase
      .from("practice_scenarios")
      .insert({
        tutor_id: tutor.id,
        title: "Restaurant Ordering in Spanish",
        description: "Practice ordering food and drinks at a Spanish restaurant. Learn common phrases for making reservations, asking about the menu, and paying the bill.",
        language: "Spanish",
        level: "intermediate",
        topic: "Restaurant & Dining",
        system_prompt: `You are a friendly waiter at a Spanish restaurant called "El Toro Rojo". The student is practicing their Spanish by ordering a meal.

Your goals:
1. Greet the student warmly in Spanish
2. Present the menu options (tapas, main courses, drinks, desserts)
3. Take their order, asking clarifying questions when needed
4. Suggest wine pairings or daily specials
5. Handle payment requests

Speak entirely in Spanish. If the student makes grammar mistakes, gently correct them by rephrasing their sentence correctly. Keep responses conversational and encouraging.

Menu items you can offer:
- Tapas: patatas bravas, jamón serrano, aceitunas, pan con tomate
- Principales: paella, tortilla española, pescado del día, cordero asado
- Bebidas: agua, vino tinto, sangría, cerveza
- Postres: flan, churros con chocolate, helado`,
        vocabulary_focus: ["pedir", "la cuenta", "mesa para dos", "de primero", "de segundo", "recomendar", "vegetariano", "alérgico"],
        grammar_focus: ["present tense conjugation", "formal usted vs informal tú", "me gustaría + infinitive"],
        max_messages: 20,
        is_active: true,
        is_public: false,
      })
      .select("id")
      .single();

    if (scenarioError || !newScenario) {
      console.error("Could not create scenario:", scenarioError);
      process.exit(1);
    }
    scenarioId = newScenario.id;
    console.log(`Created scenario: ${scenarioId}`);
  }

  // Create a second scenario for variety
  const { data: existingScenario2 } = await supabase
    .from("practice_scenarios")
    .select("id")
    .eq("tutor_id", tutor.id)
    .eq("title", "Job Interview Preparation")
    .maybeSingle();

  if (!existingScenario2) {
    await supabase.from("practice_scenarios").insert({
      tutor_id: tutor.id,
      title: "Job Interview Preparation",
      description: "Practice answering common job interview questions in Spanish. Build confidence for professional situations.",
      language: "Spanish",
      level: "advanced",
      topic: "Professional & Career",
      system_prompt: `You are an HR manager conducting a job interview in Spanish for a marketing position at a tech company.

Your goals:
1. Start with common interview questions (tell me about yourself, why this company, strengths/weaknesses)
2. Ask about work experience and achievements
3. Present hypothetical scenarios to test problem-solving
4. Allow the candidate to ask questions

Use formal Spanish (usted). If the student makes errors, note them and continue naturally. At the end, provide brief feedback.`,
      vocabulary_focus: ["experiencia laboral", "fortalezas", "debilidades", "objetivos profesionales", "trabajar en equipo"],
      grammar_focus: ["conditional tense", "past tense (pretérito)", "subjunctive mood"],
      max_messages: 25,
      is_active: true,
    });
    console.log("Created second scenario: Job Interview Preparation");
  }

  // 4. Create Practice Assignment
  let assignmentId: string;
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const { data: existingAssignment } = await supabase
    .from("practice_assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("scenario_id", scenarioId)
    .eq("status", "assigned")
    .maybeSingle();

  if (existingAssignment) {
    assignmentId = existingAssignment.id;
    console.log(`Using existing assignment: ${assignmentId}`);
  } else {
    const { data: newAssignment, error: assignmentError } = await supabase
      .from("practice_assignments")
      .insert({
        tutor_id: tutor.id,
        student_id: studentId,
        scenario_id: scenarioId,
        title: "Restaurant Practice - Complete before next lesson",
        instructions: "Practice ordering a complete meal in Spanish. Try to use formal language (usted) and practice asking about ingredients for dietary restrictions. Complete at least one full conversation with the AI.",
        status: "assigned",
        due_date: twoDaysFromNow.toISOString(),
      })
      .select("id")
      .single();

    if (assignmentError || !newAssignment) {
      console.error("Could not create assignment:", assignmentError);
      process.exit(1);
    }
    assignmentId = newAssignment.id;
    console.log(`Created assignment: ${assignmentId}`);
  }

  // 5. Create a completed practice session with messages (example data)
  const { data: existingSession } = await supabase
    .from("student_practice_sessions")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", tutor.id)
    .limit(1)
    .maybeSingle();

  let sessionId: string | undefined;
  if (!existingSession) {
    const sessionEndTime = new Date();
    sessionEndTime.setHours(sessionEndTime.getHours() - 1);
    const sessionStartTime = new Date(sessionEndTime);
    sessionStartTime.setMinutes(sessionStartTime.getMinutes() - 15);

    const { data: newSession, error: sessionError } = await supabase
      .from("student_practice_sessions")
      .insert({
        student_id: studentId,
        tutor_id: tutor.id,
        assignment_id: null, // This is a free practice session
        scenario_id: scenarioId,
        language: "Spanish",
        level: "intermediate",
        topic: "Restaurant & Dining",
        message_count: 8,
        tokens_used: 1250,
        estimated_cost_cents: 3,
        duration_seconds: 900, // 15 minutes
        ai_feedback: {
          vocabulary_used: ["mesa", "menú", "agua", "paella", "gracias"],
          grammar_issues: [
            { category: "verb_tense", count: 2, examples: ["Yo querer agua" ] },
            { category: "article", count: 1, examples: ["Dame el agua" ] },
          ],
          suggestions: [
            "Great job using polite phrases! Try using 'Me gustaría' for more formal requests.",
            "Practice the difference between 'ser' and 'estar' for describing food.",
          ],
          overall_rating: 4,
        },
        student_rating: 4,
        started_at: sessionStartTime.toISOString(),
        ended_at: sessionEndTime.toISOString(),
      })
      .select("id")
      .single();

    if (sessionError || !newSession) {
      console.error("Could not create session:", sessionError);
    } else {
      sessionId = newSession.id;
      console.log(`Created completed session: ${sessionId}`);

      // Add sample messages
      const messages = [
        {
          session_id: sessionId,
          role: "assistant",
          content: "¡Buenas tardes! Bienvenido a El Toro Rojo. ¿Mesa para cuántas personas?",
          created_at: new Date(sessionStartTime.getTime() + 1000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "user",
          content: "Buenas tardes. Mesa para dos personas, por favor.",
          created_at: new Date(sessionStartTime.getTime() + 60000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "assistant",
          content: "Perfecto, síganme por favor. Aquí tienen el menú. ¿Desean comenzar con algo de beber?",
          created_at: new Date(sessionStartTime.getTime() + 120000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "user",
          content: "Yo querer agua, por favor.",
          corrections: [
            {
              original: "Yo querer agua",
              corrected: "Yo quiero agua",
              explanation: "Use 'quiero' (first person singular) instead of 'querer' (infinitive)",
            },
          ],
          created_at: new Date(sessionStartTime.getTime() + 180000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "assistant",
          content: "Muy bien, agua para usted. *Nota: Decimos 'Yo quiero agua' o simplemente 'Quiero agua, por favor.'* ¿Y para su acompañante?",
          created_at: new Date(sessionStartTime.getTime() + 240000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "user",
          content: "Él quiere una cerveza. ¿Tienen paella?",
          created_at: new Date(sessionStartTime.getTime() + 300000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "assistant",
          content: "¡Sí, tenemos paella! Es nuestra especialidad. La paella valenciana con mariscos es muy popular. ¿Les gustaría probarla?",
          created_at: new Date(sessionStartTime.getTime() + 360000).toISOString(),
        },
        {
          session_id: sessionId,
          role: "user",
          content: "Sí, me gustaría la paella valenciana para dos. Gracias.",
          vocabulary_used: ["me gustaría", "para dos", "gracias"],
          created_at: new Date(sessionStartTime.getTime() + 420000).toISOString(),
        },
      ];

      await supabase.from("student_practice_messages").insert(messages);
      console.log(`Created ${messages.length} sample messages`);
    }
  } else {
    console.log(`Using existing session: ${existingSession.id}`);
  }

  // 6. Create Homework Assignment
  const homeworkDueDate = new Date();
  homeworkDueDate.setDate(homeworkDueDate.getDate() + 3);

  const { data: existingHomework } = await supabase
    .from("homework_assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("title", "Spanish Vocabulary: Restaurant & Food")
    .maybeSingle();

  let homeworkId: string;
  if (existingHomework) {
    homeworkId = existingHomework.id;
    console.log(`Using existing homework: ${homeworkId}`);
  } else {
    const { data: newHomework, error: homeworkError } = await supabase
      .from("homework_assignments")
      .insert({
        tutor_id: tutor.id,
        student_id: studentId,
        title: "Spanish Vocabulary: Restaurant & Food",
        instructions: `Complete the following exercises before our next lesson:

1. **Vocabulary Review**: Study the restaurant vocabulary list attached below
2. **Writing Practice**: Write 5 sentences using the new vocabulary
3. **Audio Practice**: Listen to the restaurant dialogue and answer the comprehension questions
4. **Bonus**: Complete one AI Practice session using the "Restaurant Ordering" scenario

Focus especially on:
- How to ask for the menu ("¿Me puede traer el menú, por favor?")
- How to order drinks and food politely
- How to ask for the bill ("La cuenta, por favor")`,
        status: "assigned",
        due_date: homeworkDueDate.toISOString(),
        attachments: [
          {
            label: "Restaurant Vocabulary PDF",
            url: "https://example.com/vocab-restaurant.pdf",
            type: "pdf",
          },
          {
            label: "Audio: Restaurant Dialogue",
            url: "https://example.com/audio-restaurant.mp3",
            type: "audio",
          },
          {
            label: "SpanishDict: Restaurant Vocabulary",
            url: "https://www.spanishdict.com/guide/food-vocabulary-in-spanish",
            type: "link",
          },
        ],
        tutor_notes: "Carlos struggles with verb conjugation - emphasize present tense practice.",
      })
      .select("id")
      .single();

    if (homeworkError || !newHomework) {
      console.error("Could not create homework:", homeworkError);
      process.exit(1);
    }
    homeworkId = newHomework.id;
    console.log(`Created homework: ${homeworkId}`);
  }

  // Create a second homework assignment that's in progress
  const { data: existingHomework2 } = await supabase
    .from("homework_assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("title", "Grammar Exercise: Ser vs Estar")
    .maybeSingle();

  if (!existingHomework2) {
    const homework2DueDate = new Date();
    homework2DueDate.setDate(homework2DueDate.getDate() - 1); // Yesterday (overdue)

    await supabase.from("homework_assignments").insert({
      tutor_id: tutor.id,
      student_id: studentId,
      title: "Grammar Exercise: Ser vs Estar",
      instructions: "Complete the ser vs estar worksheet. Focus on understanding when to use each verb.",
      status: "in_progress",
      due_date: homework2DueDate.toISOString(),
      attachments: [
        {
          label: "Ser vs Estar Worksheet",
          url: "https://example.com/ser-estar-worksheet.pdf",
          type: "pdf",
        },
      ],
      student_notes: "I'm confused about using estar with emotions",
    });
    console.log("Created second homework: Ser vs Estar (in progress, overdue)");
  }

  // 7. Create Usage Period for free tier tracking
  const periodStart = new Date();
  periodStart.setDate(1); // First of the month
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existingPeriod } = await supabase
    .from("practice_usage_periods")
    .select("id")
    .eq("student_id", studentId)
    .gte("period_start", periodStart.toISOString())
    .maybeSingle();

  if (!existingPeriod) {
    const { error: periodError } = await supabase.from("practice_usage_periods").insert({
      student_id: studentId,
      tutor_id: tutor.id,
      subscription_id: "free_tier",
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      audio_seconds_used: 450, // 7.5 minutes used
      text_turns_used: 85,
      blocks_consumed: 0,
      current_tier_price_cents: 0,
    });

    if (periodError) {
      console.error("Could not create usage period:", periodError);
    } else {
      console.log("Created usage period for current month");
    }
  } else {
    console.log(`Using existing usage period`);
  }

  // 8. Create learning stats if not exists
  const { data: existingStats } = await supabase
    .from("learning_stats")
    .select("id")
    .eq("student_id", studentId)
    .eq("tutor_id", tutor.id)
    .maybeSingle();

  if (!existingStats) {
    await supabase.from("learning_stats").insert({
      student_id: studentId,
      tutor_id: tutor.id,
      total_lessons: 8,
      total_minutes: 420,
      homework_completed: 5,
      practice_sessions_completed: 3,
      practice_minutes: 45,
      practice_messages_sent: 28,
    });
    console.log("Created learning stats");
  }

  console.log("\n" + "=".repeat(60));
  console.log("AI Practice & Homework seed complete!");
  console.log("=".repeat(60));
  console.log("\n--- TUTOR DASHBOARD URLS ---");
  console.log(`Practice Scenarios: http://localhost:3000/practice-scenarios`);
  console.log(`Student Detail:     http://localhost:3000/students/${studentId}`);
  console.log(`\n--- STUDENT PORTAL URLS ---`);
  console.log(`Progress Dashboard: http://localhost:3000/student/progress`);
  console.log(`Practice Session:   http://localhost:3000/student/practice/${assignmentId}`);
  console.log(`Homework Page:      http://localhost:3000/student/homework`);
  console.log("\n--- TEST CREDENTIALS ---");
  console.log(`Tutor Email: ${TUTOR_EMAIL}`);
  console.log(`Student:     Carlos Martinez (carlos.practice@tutorlingua.test)`);
  console.log(`Student ID:  ${studentId}`);
}

seedAIPracticeHomework().catch(console.error);
