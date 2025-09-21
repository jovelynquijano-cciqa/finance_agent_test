// const { test, expect } = require("@playwright/test");

// test("AR Spike E2E happy path", async ({ request }) => {
//   const token = process.env.TEST_JWT || "mocked-jwt";

//   const res = await request.post("https://phoenix-ten-mu.vercel.app", {
//     headers: { Authorization: `Bearer ${token}` },
//     data: { tenant_id: "jovie.ragoro@ClickTekConsultingInc.onmicrosoft.com", as_of_date: "2025-09-21" }
//   });

//   expect(res.status()).toBe(200);
//   const body = await res.json();

//   // Verify traceability + output fields
//   expect(body).toHaveProperty("trace_id");
//   expect(body).toHaveProperty("tenant_id", "jovie.ragoro@ClickTekConsultingInc.onmicrosoft.com");
// //   expect(body.results[0]).toHaveProperty("customer_id");
// //   expect(body.results[0]).toHaveProperty("overdue_14d");
// //   expect(body.results[0]).toHaveProperty("spike_pct");
// });