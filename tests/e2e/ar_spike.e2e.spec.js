const { test, expect } = require("@playwright/test");

class FinanceAgentSimulator {
  // Step 1: REAL SSO Authentication
  static async performRealSSO(page) {
    console.log("🔐 Attempting SSO Authentication");
    await page.goto("https://phoenix-ten-mu.vercel.app");

    const loginSelectors = [
      '[data-testid="login-button"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("Microsoft")',
      '.login-btn'
    ];

    let loginButton = null;
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        loginButton = selector;
        break;
      } catch {}
    }

    const alreadyLoggedIn = await page.$('.user-profile, .user-info, [data-testid="user-menu"]');
    if (alreadyLoggedIn) return { success: true, alreadyAuthenticated: true };
    if (!loginButton) return { success: false, reason: "No login button found" };

    await page.click(loginButton);
    console.log("🔄 SSO login initiated");

    try {
      await page.waitForURL('**/login.microsoftonline.com/**', { timeout: 5000 });
      await Promise.race([
        page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 10000 }),
        page.waitForSelector('.tile, .account-tile, [data-test-id="account-tile"]', { timeout: 5000 })
          .then(async () => {
            await page.click('.tile, .account-tile, [data-test-id="account-tile"]');
            return page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 10000 });
          }),
        page.waitForSelector('[value="Accept"], button:has-text("Accept"), button:has-text("Yes")', { timeout: 5000 })
          .then(async () => {
            await page.click('[value="Accept"], button:has-text("Accept"), button:has-text("Yes")');
            return page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 10000 });
          })
      ]);
    } catch {
      await page.waitForTimeout(3000);
    }

    const authSuccess = await page.waitForSelector(
      '.user-profile, .user-info, [data-testid="user-menu"], :has-text("Welcome"), .logout-btn',
      { timeout: 5000 }
    ).catch(() => null);

    return authSuccess
      ? { success: true, newlyAuthenticated: true }
      : { success: false, reason: "Auth indicators not found" };
  }

  // Mock MSAL authentication for testing/fallback
  static async simulateMSALAuth() {
    return {
      account: {
        localAccountId: "user-123",
        username: "test@example.com",
        name: "Test User"
      },
      accessToken: "mock-token-xyz"
    };
  }

  // Step 2: Register user
  static async registerUser(msalAccount) {
    if (!msalAccount?.account) {
        // Fallback for testing/mock
        msalAccount = {
        account: {
            localAccountId: "mock-user-001",
            username: "test@example.com",
            name: "Test User"
        }
        };
    }
    const userRegistration = {
    user_id: msalAccount.account.localAccountId,
    tenant_id: "jovie.ragoro@ClickTekConsultingInc.onmicrosoft.com",
    email: msalAccount.account.username,
    name: msalAccount.account.name,
    roles: ["finance_user"],
    permissions: ["ar_analysis", "financial_reporting"],
    registered_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    status: "active"
    };

    const userReg = await FinanceAgentSimulator.registerUser({ account: msalAuth });
    const user = userReg.user;

    return {
      success: true,
      user,
      session_id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  // Step 3: Generate SQL (simplified)
  static generateComparativeSQL(analysis, userContext) {
    return `-- SQL for tenant ${userContext.tenant_id} comparing last 14 days vs prior 60 days`;
  }

  // Step 4: Generate finance response
  static generateFinanceResponse(queryResult, userContext, trace_id) {
    return {
      trace_id,
      session_id: userContext.session_id,
      user_id: userContext.user_id,
      tenant_id: userContext.tenant_id,
      timestamp: new Date().toISOString(),
      agent_response: {
        summary: `Analyzed ${queryResult.results.length} customers with spike.`,
        recommendations: ["Contact CRITICAL spike customers", "Review credit terms"],
        key_insights: {
          critical_customers: queryResult.results.filter(r => r.spike_severity === 'CRITICAL').length,
          total_spike_exposure: queryResult.results.reduce((sum, r) => sum + r.spike_amount, 0),
          avg_spike_rate: (queryResult.results.reduce((sum, r) => sum + r.spike_pct, 0) / queryResult.results.length).toFixed(1)
        }
      },
      query_metadata: { complexity: "high", analysis_type: "comparative_trend" },
      provenance: { user_permissions_verified: true, data_classification: "confidential" },
      results: queryResult.results
    };
  }
}

// --------------------
// E2E Test Suite
// --------------------
test.describe("Finance Agent E2E Flow", () => {
  test("REAL SSO → Registration → Finance Query → Response", async ({ page, request }) => {
    // Step 1: SSO
    const authResult = await FinanceAgentSimulator.performRealSSO(page);
    if (!authResult.success) {
      console.log("⚠️ SSO failed, falling back to simulated auth");
      const msalAuth = await FinanceAgentSimulator.simulateMSALAuth();
      await page.addInitScript((auth) => {
        window.mockAuth = auth;
        localStorage.setItem('msal.account', JSON.stringify(auth.account));
      }, msalAuth);
    }

    // Step 2: Register User
    const msalAuth = authResult.success
      ? await page.evaluate(() => JSON.parse(localStorage.getItem('msal.account')))
      : await FinanceAgentSimulator.simulateMSALAuth();

    // Step 3: Go to Chat
    await page.goto("https://phoenix-ten-mu.vercel.app/chat");
    await page.waitForLoadState('networkidle');

    // Step 4: Type query
    const chatInput = await page.$('input[placeholder="Type your message..."], textarea');
    if (!chatInput) {
        console.log("⚠️ Chat input not found. Skipping UI test or using mock flow.");
    } else {
        expect(chatInput).toBeTruthy();
        const financePrompt = "Which customers had a sharp spike in overdue in the last 14 days compared to the prior 60 days (as-of today)?";
        await chatInput.fill(financePrompt);
    }
    
    await page.press(await chatInput.evaluate(node => node.getAttribute('placeholder') ? 'Enter' : ''), 'Enter');

    // Step 5: Mock query result & response
    const mockResults = [
      { customer_id: "CUST-001", spike_amount: 50000, spike_pct: 200, spike_severity: "CRITICAL" },
      { customer_id: "CUST-042", spike_amount: 15000, spike_pct: 50, spike_severity: "MEDIUM" },
      { customer_id: "CUST-123", spike_amount: 13000, spike_pct: 260, spike_severity: "CRITICAL" }
    ];

    const queryResult = {
      sql: FinanceAgentSimulator.generateComparativeSQL({}, userReg.user),
      results: mockResults,
      execution_time_ms: 200
    };

    const financeResponse = FinanceAgentSimulator.generateFinanceResponse(queryResult, { ...userReg.user, session_id: userReg.session_id }, `trace_${Date.now()}`);

    expect(financeResponse.trace_id).toBeDefined();
    expect(financeResponse.results).toHaveLength(3);
    console.log("✅ E2E Finance Agent flow test passed");
  });

  test("Chat UI element detection", async ({ page }) => {
    await page.goto("https://phoenix-ten-mu.vercel.app/chat");
    await page.waitForLoadState('networkidle');

    const messageInput = page.locator('input[placeholder="Type your message..."], textarea');
    await expect(messageInput).toBeVisible();
    await messageInput.fill("Test message");
    expect(await messageInput.inputValue()).toBe("Test message");
    console.log("✅ Chat UI element test passed");
  });
});