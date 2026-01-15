import { test, expect, createE2EAdminClient } from "./fixtures";
import { randomUUID } from "node:crypto";

test.describe("Support ticket flow", () => {
  test.setTimeout(2 * 60 * 1000);
  test.describe.configure({ mode: "serial" });

  const runId = randomUUID();
  const admin = {
    email: `e2e.admin.${runId}@example.com`,
    fullName: `E2E Admin ${runId}`,
    username: `e2e-admin-${runId.slice(0, 8)}`,
    password: `AdminT3st!${runId.slice(0, 8)}`,
  };

  let adminClient: ReturnType<typeof createE2EAdminClient>;
  let adminAuthId: string | null = null;
  let adminRecordId: string | null = null;

  test.beforeAll(async () => {
    adminClient = createE2EAdminClient();

    const { data: adminUser, error: adminError } = await adminClient.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: {
        full_name: admin.fullName,
        username: admin.username,
        role: "admin",
        plan: "professional",
      },
    });

    if (adminError || !adminUser.user) {
      throw new Error(`Failed to create admin user: ${adminError?.message}`);
    }

    adminAuthId = adminUser.user.id;

    await adminClient.from("profiles").upsert({
      id: adminAuthId,
      email: admin.email,
      full_name: admin.fullName,
      username: admin.username,
      role: "admin",
      plan: "professional",
      onboarding_completed: true,
      timezone: "UTC",
    });

    const { data: adminRecord, error: adminRecordError } = await adminClient
      .from("admin_users")
      .insert({
        email: admin.email.toLowerCase(),
        full_name: admin.fullName,
        role: "admin",
        is_active: true,
      })
      .select("id")
      .single();

    if (adminRecordError || !adminRecord) {
      throw new Error(`Failed to create admin record: ${adminRecordError?.message}`);
    }

    adminRecordId = adminRecord.id;
  });

  test.afterAll(async () => {
    if (adminRecordId) {
      await adminClient.from("admin_users").delete().eq("id", adminRecordId);
    }
    if (adminAuthId) {
      await adminClient.auth.admin.deleteUser(adminAuthId);
    }
  });

  test("tutor submits a ticket and admin resolves it", async ({ testTutor, browser }) => {
    const subject = `Support request ${runId}`;
    const message = `Test support message ${runId}`;

    await testTutor.goto("/support");

    await testTutor.getByLabel(/subject/i).fill(subject);
    await testTutor.getByLabel(/message/i).fill(message);
    await testTutor.getByRole("button", { name: /send message/i }).click();

    await expect(testTutor.getByText("Message Sent!")).toBeVisible();
    await expect(testTutor.getByText(subject)).toBeVisible({ timeout: 15000 });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    try {
      await adminPage.goto("/admin/login");
      await adminPage.getByLabel(/email/i).fill(admin.email);
      await adminPage.getByLabel(/password/i).fill(admin.password);
      await adminPage.getByRole("button", { name: /sign in/i }).click();
      await adminPage.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

      await adminPage.goto("/admin/support");

      const filterSelect = adminPage.getByRole("combobox");
      await filterSelect.click();
      await adminPage.getByRole("option", { name: /all tickets/i }).click();

      const ticketRow = adminPage.getByRole("button", { name: new RegExp(subject, "i") });
      await expect(ticketRow).toBeVisible({ timeout: 15000 });
      await ticketRow.click();

      const resolvedButton = adminPage.getByRole("button", { name: "Resolved" });
      await resolvedButton.click();

      await expect(ticketRow).toContainText("Resolved", { timeout: 15000 });
    } finally {
      await adminContext.close();
    }
  });
});
