const { test, expect } = require("@playwright/test");

test("E2E Happy Path: AR Spike Detector", async ({ request }) => {
  const token = process.env.TEST_JWT || "mocked-jwt";

  const res = await request.post("https://staging-api/finance/ar-spike", {
    headers: { Authorization: `Bearer ${token}` },
    data: { tenant_id: "t123", as_of_date: "2025-09-01" }
  });

  expect(res.status()).toBe(200);
  const body = await res.json();

  // Verify traceability + output fields
  expect(body).toHaveProperty("trace_id");
  expect(body).toHaveProperty("tenant_id", "t123");
  expect(body.results[0]).toHaveProperty("customer_id");
  expect(body.results[0]).toHaveProperty("overdue_14d");
  expect(body.results[0]).toHaveProperty("spike_pct");
});