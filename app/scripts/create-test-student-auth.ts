/**
 * Create auth account for test student Carlos Martinez
 * Run with: npx tsx scripts/create-test-student-auth.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const STUDENT_EMAIL = "carlos.practice@tutorlingua.test";
const STUDENT_PASSWORD = "test1234";

async function main() {
  console.log("Creating auth account for Carlos Martinez...\n");

  let userId: string;

  // Try to create, if exists then get existing user
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "student", full_name: "Carlos Martinez" }
  });

  if (error && error.message.includes("already been registered")) {
    // User exists, find and update password
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    const existingUser = existingUsers?.users.find(u => u.email === STUDENT_EMAIL);

    if (!existingUser) {
      // Try getUserByEmail if available
      const { data: userByEmail } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", STUDENT_EMAIL)
        .single();

      if (userByEmail) {
        userId = userByEmail.id;
      } else {
        console.error("User exists but cannot be found. Try logging in with existing password.");
        console.log("\nEmail:", STUDENT_EMAIL);
        console.log("Try password: test1234 or your previously set password");
        process.exit(0);
      }
    } else {
      userId = existingUser.id;
    }

    console.log(`Auth user already exists: ${userId}`);
    await supabase.auth.admin.updateUserById(userId, { password: STUDENT_PASSWORD });
    console.log("Password reset to:", STUDENT_PASSWORD);
  } else if (error) {
    console.error("Failed to create auth user:", error);
    process.exit(1);
  } else {
    userId = newUser.user.id;
    console.log(`Created auth user: ${userId}`);
  }

  // Link to student record
  const { data: student, error: studentError } = await supabase
    .from("students")
    .update({ user_id: userId })
    .eq("email", STUDENT_EMAIL)
    .select("id, full_name")
    .single();

  if (studentError) {
    console.error("Failed to link student:", studentError);
  } else {
    console.log(`Linked to student record: ${student.full_name} (${student.id})`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("TEST STUDENT CREDENTIALS");
  console.log("=".repeat(50));
  console.log(`Email:    ${STUDENT_EMAIL}`);
  console.log(`Password: ${STUDENT_PASSWORD}`);
  console.log("\nLogin at: http://localhost:3000/student-auth/login");
  console.log("=".repeat(50));
}

main().catch(console.error);
