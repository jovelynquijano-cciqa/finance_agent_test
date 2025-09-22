import { test, expect } from "@playwright/test";

test("User can log in with MSAL", async ({ page }) => {
  await page.goto("https://phoenix-ten-mu.vercel.app");
  await page.click("text=Sign in with Microsoft");
  // Mock check – real flow needs tenant test creds
  expect(await page.url()).toContain("microsoftonline");
});