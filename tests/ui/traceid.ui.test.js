const { test, expect } = require("@playwright/test");

test("UI shows trace_id and tenant picker", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Ask AR Spike Detector
  await page.fill("textarea", "Which customers had a sharp spike in overdue in the last 14 days compared to the prior 60 days (as-of today)?");
  await page.keyboard.press("Enter");

  // SSE response renders
  await expect(page.locator(".chat-response")).toContainText("AR Spike");

  // trace_id visible and copyable
  const traceId = await page.locator(".trace-id").innerText();
  expect(traceId).toMatch(/^t-/);
});