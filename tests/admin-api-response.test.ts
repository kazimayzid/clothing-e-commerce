import assert from "node:assert/strict";
import test from "node:test";
import { apiResponseError, readApiResponse } from "../lib/admin-api-response";

test("category admin API response parser accepts JSON and surfaces API errors", async () => {
  const result = await readApiResponse(new Response(JSON.stringify({ flatCategories: [] }), { status: 200 }));
  assert.deepEqual(result.flatCategories, []);
  assert.equal(apiResponseError({ error: "Access denied." }, "fallback"), "Access denied.");
  assert.equal(apiResponseError({}, "fallback"), "fallback");
});

test("category admin API response parser gives useful errors for empty and malformed bodies", async () => {
  await assert.rejects(readApiResponse(new Response(null, { status: 500 })), /empty response \(HTTP 500\)/);
  await assert.rejects(readApiResponse(new Response("<html>failed</html>", { status: 500 })), /invalid response \(HTTP 500\)/);
  await assert.rejects(readApiResponse(new Response("[]", { status: 200 })), /invalid response \(HTTP 200\)/);
});
