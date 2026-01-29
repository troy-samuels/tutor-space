import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  badRequest,
  errorResponse,
  forbidden,
  internalError,
  unauthorized,
} from "../../../lib/api/error-responses.ts";

async function readJson(response: Response) {
  const data = await response.json();
  return data as Record<string, unknown>;
}

describe("api error responses", () => {
  it("adds success false and requestId by default", async () => {
    const response = errorResponse("Boom");
    const body = await readJson(response);

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(body.error, "Boom");
    assert.equal(body.message, "Boom");
    assert.equal(body.code, "internal_error");
    assert.equal(typeof body.requestId, "string");
    assert.ok((body.requestId as string).length > 0);
  });

  it("respects provided requestId and preserves extra fields", async () => {
    const response = errorResponse("Invalid", {
      status: 400,
      code: "invalid_request",
      extra: {
        requestId: "req-123",
        hint: "missing field",
      },
    });

    const body = await readJson(response);

    assert.equal(response.status, 400);
    assert.equal(body.requestId, "req-123");
    assert.equal(body.hint, "missing field");
  });

  it("includes details payloads when provided", async () => {
    const response = errorResponse("Invalid", {
      status: 400,
      code: "invalid_request",
      details: { issues: [{ field: "email", reason: "required" }] },
    });

    const body = await readJson(response);
    assert.deepEqual(body.details, { issues: [{ field: "email", reason: "required" }] });
  });

  it("helpers map to expected status codes", async () => {
    const bad = badRequest("Bad input");
    const badBody = await readJson(bad);
    assert.equal(bad.status, 400);
    assert.equal(badBody.code, "invalid_request");

    const unauth = unauthorized("Nope");
    const unauthBody = await readJson(unauth);
    assert.equal(unauth.status, 401);
    assert.equal(unauthBody.code, "unauthorized");

    const forbid = forbidden("Nope");
    const forbidBody = await readJson(forbid);
    assert.equal(forbid.status, 403);
    assert.equal(forbidBody.code, "forbidden");

    const internal = internalError("Oops");
    const internalBody = await readJson(internal);
    assert.equal(internal.status, 500);
    assert.equal(internalBody.code, "internal_error");
  });
});
