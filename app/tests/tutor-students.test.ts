import test from "node:test";
import assert from "node:assert/strict";

import { __tutorStudentsTesting } from "../lib/actions/tutor-students.ts";

const { approveStudentAccessWithClients } = __tutorStudentsTesting;

type SelectChain<T> = {
  filters: Array<{ column: string; value: unknown }>;
  eq: (column: string, value: unknown) => SelectChain<T>;
  single: () => Promise<{ data: T | null; error: unknown }>;
};

type UpdateChain = {
  filters: Array<{ column: string; value: unknown }>;
  lastUpdate: Record<string, unknown> | null;
  eq: (column: string, value: unknown) => UpdateChain;
};

function createSelectChain<T>(result: T | null): SelectChain<T> {
  const chain: SelectChain<T> = {
    filters: [],
    eq(column, value) {
      this.filters.push({ column, value });
      return this;
    },
    async single() {
      return {
        data: result,
        error: result ? null : new Error("not found"),
      };
    },
  };

  return chain;
}

function createUpdateChain(): UpdateChain {
  const chain: UpdateChain = {
    filters: [],
    lastUpdate: null,
    eq(column, value) {
      this.filters.push({ column, value });
      return this;
    },
  };
  return chain;
}

function buildAdminClient({
  studentSelect,
  requestSelect,
  profileSelect,
}: {
  studentSelect: SelectChain<unknown>;
  requestSelect?: SelectChain<unknown>;
  profileSelect?: SelectChain<unknown>;
}) {
  const studentUpdate = createUpdateChain();
  const requestUpdate = createUpdateChain();

  return {
    chains: {
      studentSelect,
      studentUpdate,
      requestSelect,
      requestUpdate,
      profileSelect,
    },
    from(table: string) {
      switch (table) {
        case "students":
          return {
            select: () => studentSelect,
            update: (values: Record<string, unknown>) => {
              studentUpdate.lastUpdate = values;
              return studentUpdate;
            },
          };
        case "student_access_requests":
          return {
            select: () => requestSelect ?? createSelectChain(null),
            update: (values: Record<string, unknown>) => {
              requestUpdate.lastUpdate = values;
              return requestUpdate;
            },
          };
        case "profiles":
          return {
            select: () => profileSelect ?? createSelectChain(null),
          };
        default:
          return {
            select: () => createSelectChain(null),
            update: () => createUpdateChain(),
          };
      }
    },
  };
}

function createSupabaseClient(userId: string) {
  return {
    auth: {
      async getUser() {
        return {
          data: { user: { id: userId } },
          error: null,
        };
      },
    },
  };
}

const tutorId = "tutor-123";
const studentId = "student-456";
const requestId = "request-789";

test("approveStudentAccessWithClients rejects unauthorized student", async () => {
  const supabase = createSupabaseClient(tutorId);
  const studentSelect = createSelectChain(null);
  const adminClient = buildAdminClient({ studentSelect });

  const result = await approveStudentAccessWithClients(
    supabase as Parameters<typeof approveStudentAccessWithClients>[0],
    adminClient as Parameters<typeof approveStudentAccessWithClients>[1],
    {
      requestId,
      studentId,
    },
    {
      sendApprovedEmail: async () => {},
    }
  );

  assert.deepStrictEqual(result, { error: "Student not found or access denied" });

  const tutorFilter = studentSelect.filters.find((filter) => filter.column === "tutor_id");
  assert.ok(tutorFilter, "student query must scope by tutor_id");
  assert.equal(tutorFilter!.value, tutorId);
});

test("approveStudentAccessWithClients scopes updates by tutor", async () => {
  const supabase = createSupabaseClient(tutorId);

  const studentSelect = createSelectChain({
    id: studentId,
    tutor_id: tutorId,
    full_name: "Student One",
    email: "student@example.com",
    profiles: [
      {
        full_name: "Tutor Name",
        email: "tutor@example.com",
        username: "tutorname",
        instagram_handle: null,
        website_url: null,
      },
    ],
  });

  const requestSelect = createSelectChain({ id: requestId });
  const profileSelect = createSelectChain({
    full_name: "Tutor Name",
    email: "tutor@example.com",
    payment_general_instructions: null,
    payment_venmo_handle: null,
    payment_paypal_email: null,
    payment_zelle_phone: null,
    payment_stripe_link: null,
    payment_custom_url: null,
  });

  const adminClient = buildAdminClient({
    studentSelect,
    requestSelect,
    profileSelect,
  });

  let emailCalled = false;
  const sendApprovedEmail = async () => {
    emailCalled = true;
  };

  const result = await approveStudentAccessWithClients(
    supabase as Parameters<typeof approveStudentAccessWithClients>[0],
    adminClient as Parameters<typeof approveStudentAccessWithClients>[1],
    {
      requestId,
      studentId,
      notes: "Welcome aboard",
    },
    {
      sendApprovedEmail,
    }
  );

  assert.deepStrictEqual(result, { success: true });
  assert.ok(emailCalled, "approval email should be sent");

  const studentFilters = adminClient.chains.studentUpdate.filters;
  const requestFilters = adminClient.chains.requestUpdate.filters;

  assert.ok(
    studentFilters.some((filter) => filter.column === "tutor_id" && filter.value === tutorId),
    "student update must scope by tutor_id"
  );

  assert.ok(
    requestFilters.some((filter) => filter.column === "tutor_id" && filter.value === tutorId),
    "request update must scope by tutor_id"
  );
});
