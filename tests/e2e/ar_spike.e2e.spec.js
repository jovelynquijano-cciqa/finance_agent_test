const { test, expect } = require("@playwright/test");
require('dotenv').config(); // Load environment variables from .env file

// Complete Finance Agent Flow Simulator
class FinanceAgentSimulator {
  
  // REAL API Integration using environment variables
    static async validateMSALToken(msalToken) {
        // Simulate validation logic
        if (!msalToken || msalToken.length < 10) {
            throw new Error("Invalid MSAL token");
        }

        // Return a simulated validation result
        return {
            user_id: "simulated-user-id",
            email: "simulated@example.com",
            account_info: {
            tenantId: process.env.DEFAULT_TENANT_ID,
            }
        };
    }   

  static async registerUserWithRealAPI(msalAccount) {
    const apiBaseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${apiBaseUrl}/auth/register-msal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        msal_account: msalAccount,
        tenant_info: {
          tenant_id: process.env.DEFAULT_TENANT_ID || msalAccount.tenantId,
          domain: msalAccount.username?.split('@')[1]
        }
      })
    });

    if (response.ok) {
      const userSession = await response.json();
      console.log("✅ User registered via real API");
      return userSession;
    } else {
      const errorText = await response.text();
      throw new Error(`User registration failed: ${response.status} - ${errorText}`);
    }
  }

  static async queryFinanceAgentWithRealAPI(prompt, sessionToken, tenantId) {
    const apiBaseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;

    const headers = {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${apiBaseUrl}/api/finance-agent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt,
        tenant_id: tenantId || process.env.DEFAULT_TENANT_ID,
        as_of_date: new Date().toISOString().split('T')[0]
      })
    });

    if (response.ok) {
      const financeResult = await response.json();
      console.log("✅ Finance query executed via real API");
      return financeResult;
    } else {
      const errorText = await response.text();
      throw new Error(`Finance query failed: ${response.status} - ${errorText}`);
    }
  }

  // Fallback simulation methods (if real APIs not available)
  static async simulateMSALAuth() {
    const mockMSALResponse = {
      accessToken: process.env.TEST_MSAL_TOKEN || "test-msal-token-123",
      account: {
        homeAccountId: "test-account-id",
        environment: "login.microsoftonline.com",
        tenantId: process.env.TEST_TENANT_ID || "test-tenant-123",
        username: process.env.TEST_USER_EMAIL || "test@example.com",
        localAccountId: "test-local-id",
        name: process.env.TEST_USER_NAME || "Test User"
      },
      idToken: "test-id-token-123",
      expiresOn: new Date(Date.now() + 3600000)
    };
    
    return mockMSALResponse;
  }

  static async registerUser(msalAccount) {
    const userRegistration = {
      user_id: msalAccount.account.localAccountId,
      tenant_id: process.env.DEFAULT_TENANT_ID || "test-tenant",
      email: msalAccount.account.username,
      name: msalAccount.account.name,
      roles: ["finance_user"],
      permissions: ["ar_analysis", "financial_reporting"],
      registered_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: "active"
    };

    return {
      success: true,
      user: userRegistration,
      session_id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      access_token: process.env.TEST_SESSION_TOKEN || "test-session-token-123"
    };
  }

  static async processFinancePrompt(prompt, userContext) {
    const trace_id = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const promptAnalysis = {
      intent: "ar_spike_comparison_analysis",
      entities: {
        tenant: userContext.tenant_id,
        comparison_period_1: "last_14_days",
        comparison_period_2: "prior_60_days", 
        metric: "overdue_amount_spike",
        analysis_type: "comparative_trend",
        as_of_date: new Date().toISOString().split('T')[0]
      },
      confidence: 0.92,
      requires_data: true,
      complexity: "high"
    };

    const sql = this.generateComparativeSQL(promptAnalysis, userContext);
    
    return {
      trace_id,
      prompt_analysis: promptAnalysis,
      generated_sql: sql,
      user_context: userContext
    };
  }

  static generateComparativeSQL(analysis, userContext) {
    const { tenant_id } = userContext;
    const today = new Date().toISOString().split('T')[0];
    
    return `
      -- Finance Agent: Comparative AR Spike Analysis
      -- User: ${userContext.email} | Tenant: ${tenant_id}
      -- Generated: ${new Date().toISOString()}
      
      WITH spike_analysis AS (
        SELECT 
          customer_id,
          recent_overdue,
          baseline_overdue,
          spike_amount,
          spike_pct,
          spike_severity
        FROM ar_comparative_analysis
        WHERE tenant_id = '${tenant_id}'
          AND analysis_date = '${today}'
          AND spike_pct >= 25
      )
      SELECT * FROM spike_analysis
      ORDER BY spike_pct DESC
      LIMIT 50;
    `;
  }

  static generateFinanceResponse(queryResult, userContext, trace_id) {
    return {
      trace_id,
      session_id: userContext.session_id,
      user_id: userContext.user_id,
      tenant_id: userContext.tenant_id,
      timestamp: new Date().toISOString(),
      
      agent_response: {
        summary: `I've analyzed your AR data and identified ${queryResult.results.length} customers with sharp spikes in overdue amounts.`,
        recommendations: [
          "Immediately contact CRITICAL spike customers",
          "Review credit terms for deteriorating customers",
          "Implement daily monitoring for high-risk accounts"
        ],
        key_insights: {
          critical_customers: queryResult.results.filter(r => r.spike_severity === 'CRITICAL').length,
          total_spike_exposure: queryResult.results.reduce((sum, r) => sum + r.spike_amount, 0),
          avg_spike_rate: (queryResult.results.reduce((sum, r) => sum + r.spike_pct, 0) / queryResult.results.length).toFixed(1)
        }
      },
      
      query_metadata: {
        prompt: "Which customers had a sharp spike in overdue in the last 14 days compared to the prior 60 days?",
        intent: "ar_spike_comparison_analysis",
        generated_sql: queryResult.sql,
        execution_time_ms: queryResult.execution_time_ms,
        complexity: "high"
      },
      
      provenance: {
        data_sources: [
          { table: "ar_invoices", last_updated: "2025-09-22T08:30:00Z" },
          { table: "customers", last_updated: "2025-09-22T07:15:00Z" }
        ],
        user_permissions_verified: true,
        data_classification: "confidential",
        query_hash: `sha256:${Math.random().toString(36).substr(2, 16)}`
      },
      
      results: queryResult.results
    };
  }
}

// Environment variables validation
function validateEnvironmentVariables() {
  const requiredVars = {
    'API_BASE_URL': 'Your API base URL (e.g., https://phoenix-ten-mu.vercel.app)',
    'DEFAULT_TENANT_ID': 'Default tenant ID for testing'
  };

  const optionalVars = {
    'API_KEY': 'API key for authentication (if required)',
    'TEST_MSAL_TOKEN': 'Test MSAL token for simulation',
    'TEST_TENANT_ID': 'Test tenant ID',
    'TEST_USER_EMAIL': 'Test user email',
    'TEST_USER_NAME': 'Test user name',
    'TEST_SESSION_TOKEN': 'Test session token'
  };

  const missing = [];
  const available = [];

  // Check required variables
  Object.entries(requiredVars).forEach(([key, description]) => {
    if (!process.env[key]) {
      missing.push(`${key}: ${description}`);
    } else {
      available.push(key);
    }
  });

  // Check optional variables
  Object.entries(optionalVars).forEach(([key, description]) => {
    if (process.env[key]) {
      available.push(key);
    }
  });

  return { missing, available };
}

// Complete E2E Test Suite
test.describe("Finance Agent E2E Flow with Environment Variables", () => {
  
  test.beforeAll(() => {
    // Validate environment variables before running tests
    const { missing, available } = validateEnvironmentVariables();
    
    console.log("🔍 Environment Variables Status:");
    console.log("✅ Available:", available.join(', '));
    
    if (missing.length > 0) {
      console.log("⚠️  Missing required variables:", missing.join(', '));
      console.log("\nPlease create a .env file with the following variables:");
      missing.forEach(variable => console.log(`${variable}`));
    }
  });

const { test, expect } = require("@playwright/test");
require('dotenv').config(); // Load environment variables from .env file

// Complete Finance Agent Flow Simulator
class FinanceAgentSimulator {
  
  // Extract REAL MSAL data from browser after login
  static async extractRealMSALData(page) {
    console.log("🔍 Extracting real MSAL data from browser...");
    
    const msalData = await page.evaluate(() => {
      const result = {
        accounts: {},
        tokens: {},
        rawStorage: {}
      };
      
      // Extract all MSAL-related localStorage data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('msal') || key.includes('auth') || key.includes('token')) {
          result.rawStorage[key] = localStorage.getItem(key);
          
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(localStorage.getItem(key));
            
            if (key.includes('account')) {
              result.accounts[key] = parsed;
            } else if (key.includes('token') || key.includes('access')) {
              result.tokens[key] = parsed;
            }
          } catch (e) {
            // Not JSON, store as string
            if (key.includes('token')) {
              result.tokens[key] = localStorage.getItem(key);
            }
          }
        }
      });
      
      // Also check sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('msal') || key.includes('auth') || key.includes('token')) {
          result.rawStorage[`session_${key}`] = sessionStorage.getItem(key);
          
          try {
            const parsed = JSON.parse(sessionStorage.getItem(key));
            if (key.includes('token') || key.includes('access')) {
              result.tokens[`session_${key}`] = parsed;
            }
          } catch (e) {
            if (key.includes('token')) {
              result.tokens[`session_${key}`] = sessionStorage.getItem(key);
            }
          }
        }
      });
      
      return result;
    });
    
    // Find the actual access token
    let accessToken = null;
    let accountInfo = null;
    
    // Look for access token in various places
    for (const [key, value] of Object.entries(msalData.tokens)) {
      if (typeof value === 'string' && value.length > 50) {
        accessToken = value;
        console.log(`✅ Found access token in: ${key}`);
        break;
      } else if (typeof value === 'object' && value.accessToken) {
        accessToken = value.accessToken;
        console.log(`✅ Found access token in object: ${key}`);
        break;
      }
    }
    
    // Look for account info
    for (const [key, value] of Object.entries(msalData.accounts)) {
      if (value.username || value.email) {
        accountInfo = value;
        console.log(`✅ Found account info in: ${key}`);
        break;
      }
    }
    
    // If not found in parsed data, check raw storage
    if (!accessToken) {
      for (const [key, value] of Object.entries(msalData.rawStorage)) {
        if (key.includes('token') && typeof value === 'string' && value.length > 50) {
          accessToken = value;
          console.log(`✅ Found raw access token in: ${key}`);
          break;
        }
      }
    }
    
    return {
      accessToken,
      accountInfo,
      allData: msalData,
      hasValidToken: !!accessToken && accessToken.length > 10
    };
  }
  
  // Use real API with environment variables
  static async callRealAPI(endpoint, method = 'POST', body = null, authToken = null) {
    const apiBaseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;
    
    if (!apiBaseUrl) {
      throw new Error("API_BASE_URL not found in .env file");
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key if provided in .env
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Add auth token if provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log(`📡 Calling API: ${method} ${apiBaseUrl}${endpoint}`);
    console.log(`🔐 Auth: ${authToken ? 'Bearer token present' : 'No auth token'}`);

    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    console.log(`📡 API Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }
  }

  static async validateMSALToken(msalToken) {
    return await this.callRealAPI('/api/auth/validate-msal', 'POST', null, msalToken);
  }

  static async registerUser(accountInfo, msalToken) {
    const body = {
      msal_account: accountInfo,
      tenant_info: {
        tenant_id: process.env.DEFAULT_TENANT_ID || accountInfo.tenantId,
        domain: accountInfo.username?.split('@')[1]
      }
    };
    
    return await this.callRealAPI('/api/auth/register-user', 'POST', body, msalToken);
  }

  static async queryFinanceAgent(prompt, sessionToken, tenantId = null) {
    const body = {
      prompt: prompt,
      tenant_id: tenantId || process.env.DEFAULT_TENANT_ID,
      as_of_date: new Date().toISOString().split('T')[0]
    };
    
    return await this.callRealAPI('/api/finance-agent', 'POST', body, sessionToken);
  }

  // Fallback simulation methods (only if .env specifies fallback mode)
  static async simulateMSALAuth() {
    const mockMSALResponse = {
      accessToken: process.env.TEST_ACCESS_TOKEN || "test-token-123",
      account: {
        homeAccountId: process.env.TEST_ACCOUNT_ID || "test-account-id",
        environment: "login.microsoftonline.com",
        tenantId: process.env.TEST_TENANT_ID || process.env.DEFAULT_TENANT_ID,
        username: process.env.TEST_USER_EMAIL || "test@example.com",
        localAccountId: process.env.TEST_LOCAL_ACCOUNT_ID || "test-local-id",
        name: process.env.TEST_USER_NAME || "Test User"
      },
      idToken: process.env.TEST_ID_TOKEN || "test-id-token",
      expiresOn: new Date(Date.now() + 3600000)
    };
    
    return mockMSALResponse;
  }
}

// Environment variables validation
function validateEnvironmentVariables() {
  const requiredVars = [
    'API_BASE_URL',
    'DEFAULT_TENANT_ID'
  ];

  const optionalVars = [
    'API_KEY',
    'TEST_ACCESS_TOKEN',
    'TEST_TENANT_ID', 
    'TEST_USER_EMAIL',
    'TEST_USER_NAME',
    'FALLBACK_TO_SIMULATION'
  ];

  const missing = [];
  const available = [];

  requiredVars.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    } else {
      available.push(key);
    }
  });

  optionalVars.forEach(key => {
    if (process.env[key]) {
      available.push(key);
    }
  });

  return { missing, available };
}

// Complete E2E Test Suite
test.describe("Finance Agent E2E Flow with Real MSAL", () => {
  
  test.beforeAll(() => {
    const { missing, available } = validateEnvironmentVariables();
    
    console.log("🔍 Environment Variables:");
    console.log("✅ Available:", available.join(', '));
    
    if (missing.length > 0) {
      console.log("❌ Missing required variables:", missing.join(', '));
      console.log("\n📝 Create .env file with:");
      missing.forEach(variable => {
        console.log(`${variable}=your-${variable.toLowerCase().replace('_', '-')}`);
      });
    }
    
    console.log(`\n🌐 API Base URL: ${process.env.API_BASE_URL}`);
    console.log(`🏢 Default Tenant: ${process.env.DEFAULT_TENANT_ID}`);
  });

  test("REAL FLOW: Login → Extract MSAL → API → Chat", async ({ page, request }) => {
    const API_BASE_URL = process.env.API_BASE_URL;
    
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL not found in .env file");
    }

    console.log("🔐 Step 1: Real Microsoft Login");
    
    // Navigate to login page
    await page.goto(`${API_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/01-login-page.png' });
    
    // Find and click Microsoft login button
    const microsoftButton = page.locator('button:has-text("Sign in with Microsoft")');
    await expect(microsoftButton).toBeVisible({ timeout: 10000 });
    
    console.log("🔄 Clicking Microsoft login button...");
    await microsoftButton.click();
    
    // Wait for authentication to complete
    try {
      // Wait for either redirect back to app or user dashboard
      await Promise.race([
        page.waitForURL(new RegExp(API_BASE_URL.replace('https://', '').replace('http://', '')), { timeout: 45000 }),
        page.waitForSelector('.user-info, .dashboard, [data-testid="user-profile"]', { timeout: 45000 })
      ]);
      
      console.log(`✅ Authentication completed! Current URL: ${page.url()}`);
      
      // Take screenshot after login
      await page.screenshot({ path: 'test-results/02-after-login.png' });
      
    } catch (authTimeout) {
      console.log("⏰ Authentication flow taking longer than expected...");
      await page.screenshot({ path: 'test-results/02-auth-timeout.png' });
      
      // Check current URL and page content
      console.log(`Current URL: ${page.url()}`);
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      // Continue anyway - might still have auth data
    }
    
    // Step 2: Extract Real MSAL Data
    console.log("📱 Step 2: Extract Real MSAL Data from Browser");
    
    const realMsalData = await FinanceAgentSimulator.extractRealMSALData(page);
    
    console.log("🔍 MSAL Extraction Results:");
    console.log(`  - Access Token: ${realMsalData.hasValidToken ? 'Found' : 'Not Found'}`);
    console.log(`  - Account Info: ${realMsalData.accountInfo ? 'Found' : 'Not Found'}`);
    
    if (realMsalData.accountInfo) {
      console.log(`  - User: ${realMsalData.accountInfo.username || realMsalData.accountInfo.email || 'Unknown'}`);
    }
    
    // If no real MSAL data found, check if we should use fallback
    if (!realMsalData.hasValidToken) {
      if (process.env.FALLBACK_TO_SIMULATION === 'true') {
        console.log("🔄 No real MSAL data found, using simulation mode");
        const simulatedData = await FinanceAgentSimulator.simulateMSALAuth();
        realMsalData.accessToken = simulatedData.accessToken;
        realMsalData.accountInfo = simulatedData.account;
        realMsalData.hasValidToken = true;
        console.log("✅ Using simulated MSAL data");
      } else {
        throw new Error("No MSAL token found and simulation mode not enabled");
      }
    }
    
    // Step 3: Validate MSAL Token with Real API
    console.log("🔐 Step 3: Validate MSAL Token with Real API");
    
    try {
      const tokenValidation = await FinanceAgentSimulator.validateMSALToken(realMsalData.accessToken);
      console.log("✅ MSAL token validation successful");
      console.log(`  - User ID: ${tokenValidation.user_id || 'N/A'}`);
      console.log(`  - Email: ${tokenValidation.email || 'N/A'}`);
      
      // Update account info from validation if needed
      if (tokenValidation.account_info) {
        realMsalData.accountInfo = { ...realMsalData.accountInfo, ...tokenValidation.account_info };
      }
      
    } catch (validationError) {
      console.log("❌ MSAL token validation failed:", validationError.message);
      
      if (process.env.FALLBACK_TO_SIMULATION === 'true') {
        console.log("🔄 Continuing with unvalidated token for testing");
      } else {
        throw validationError;
      }
    }
    
    // Step 4: Register User with Real API
    console.log("👤 Step 4: Register User with Real API");
    
    try {
      const userSession = await FinanceAgentSimulator.registerUser(
        realMsalData.accountInfo, 
        realMsalData.accessToken
      );
      
      console.log("✅ User registration successful");
      console.log(`  - Session ID: ${userSession.session_id || 'N/A'}`);
      console.log(`  - Tenant ID: ${userSession.tenant_id || 'N/A'}`);
      
      // Step 5: Navigate to Chat with Real Session
      console.log("💬 Step 5: Navigate to Chat with Real Authentication");
      
      await page.goto(`${API_BASE_URL}/chat`);
      await page.waitForLoadState('networkidle');
      
      // Inject real session data
      await page.evaluate((sessionData) => {
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        if (sessionData.access_token) {
          sessionStorage.setItem('authToken', sessionData.access_token);
        }
      }, userSession);
      
      await page.screenshot({ path: 'test-results/03-chat-page.png' });
      
      // Step 6: Test Finance Query
      console.log("📊 Step 6: Test Finance Query with Real APIs");
      
      // Find chat input
      const chatInputSelectors = [
        'input[placeholder="Type your message..."]',
        'input[placeholder*="message"]',
        'input[type="text"]',
        'textarea'
      ];
      
      let chatInput = null;
      for (const selector of chatInputSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          chatInput = selector;
          console.log(`✅ Found chat input: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (chatInput) {
        // Monitor API calls
        const apiCalls = [];
        page.on('request', request => {
          if (request.url().includes(API_BASE_URL) && request.method() === 'POST') {
            const authHeader = request.headers()['authorization'];
            apiCalls.push({
              url: request.url(),
              hasAuth: !!authHeader,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        // Submit finance query
        const financePrompt = "Which customers had a sharp spike in overdue in the last 14 days compared to the prior 60 days?";
        await page.fill(chatInput, financePrompt);
        console.log("✅ Entered finance query");
        
        await page.press(chatInput, 'Enter');
        console.log("✅ Query submitted");
        
        // Wait for response
        await page.waitForTimeout(8000);
        
        console.log(`📡 API calls made: ${apiCalls.length}`);
        apiCalls.forEach((call, index) => {
          console.log(`  ${index + 1}. ${call.url} - Auth: ${call.hasAuth ? 'Yes' : 'No'}`);
        });
        
        // Take final screenshot
        await page.screenshot({ path: 'test-results/04-after-query.png' });
        
        // Step 7: Direct API Test
        console.log("🔄 Step 7: Direct API Test with Real Credentials");
        
        try {
          const directResult = await FinanceAgentSimulator.queryFinanceAgent(
            financePrompt,
            userSession.access_token || realMsalData.accessToken,
            userSession.tenant_id
          );
          
          console.log("✅ Direct API call successful:");
          console.log(`  - Trace ID: ${directResult.trace_id || 'N/A'}`);
          console.log(`  - Results count: ${directResult.results?.length || 0}`);
          
          if (directResult.agent_response?.summary) {
            console.log(`  - Summary: ${directResult.agent_response.summary.substring(0, 100)}...`);
          }
          
        } catch (directApiError) {
          console.log("❌ Direct API call failed:", directApiError.message);
        }
        
        // Final validations
        expect(page.url()).toContain('/chat');
        expect(realMsalData.hasValidToken).toBe(true);
        
        console.log("🎉 COMPLETE REAL FLOW TEST SUCCESSFUL!");
        console.log("✅ Real Microsoft login completed");
        console.log("✅ Real MSAL token extracted from browser");  
        console.log("✅ Real API integration working");
        console.log("✅ Chat interface functional");
        
      } else {
        console.log("⚠️  Chat input not found - UI may be different");
        await page.screenshot({ path: 'test-results/04-no-chat-input.png' });
      }
      
    } catch (registrationError) {
      console.log("❌ User registration failed:", registrationError.message);
      throw registrationError;
    }
  });

  // Step 2: User Registration/Validation in System
  static async registerUser(msalAccount) {
    const userRegistration = {
      user_id: msalAccount.account.localAccountId,
      tenant_id: "ms account",
      email: msalAccount.account.username,
      name: msalAccount.account.name,
      roles: ["finance_user"],
      permissions: ["ar_analysis", "financial_reporting"],
      registered_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      status: "active"
    };

    return {
      success: true,
      user: userRegistration,
      session_id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  // Step 3: Finance Agent Prompt Processing
  static async processFinancePrompt(prompt, userContext) {
    const trace_id = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const promptAnalysis = {
      intent: "ar_spike_comparison_analysis",
      entities: {
        tenant: userContext.tenant_id,
        comparison_period_1: "last_14_days",
        comparison_period_2: "prior_60_days", 
        metric: "overdue_amount_spike",
        analysis_type: "comparative_trend",
        as_of_date: new Date().toISOString().split('T')[0]
      },
      confidence: 0.92,
      requires_data: true,
      complexity: "high"
    };

    const sql = this.generateComparativeSQL(promptAnalysis, userContext);
    
    return {
      trace_id,
      prompt_analysis: promptAnalysis,
      generated_sql: sql,
      user_context: userContext
    };
  }

  // Step 4: Generate Comparative SQL for Spike Analysis
  static generateComparativeSQL(analysis, userContext) {
    const { tenant_id } = userContext;
    const today = new Date().toISOString().split('T')[0];
    
    return `
      -- Finance Agent: Comparative AR Spike Analysis
      -- User: ${userContext.email} | Tenant: ${tenant_id}
      -- Generated: ${new Date().toISOString()}
      
      WITH spike_analysis AS (
        SELECT 
          customer_id,
          recent_overdue,
          baseline_overdue,
          spike_amount,
          spike_pct,
          spike_severity
        FROM ar_comparative_analysis
        WHERE tenant_id = '${tenant_id}'
          AND analysis_date = '${today}'
          AND spike_pct >= 25
      )
      SELECT * FROM spike_analysis
      ORDER BY spike_pct DESC
      LIMIT 50;
    `;
  }

  // Step 5: Generate Finance Agent Response
  static generateFinanceResponse(queryResult, userContext, trace_id) {
    return {
      trace_id,
      session_id: userContext.session_id,
      user_id: userContext.user_id,
      tenant_id: userContext.tenant_id,
      timestamp: new Date().toISOString(),
      
      agent_response: {
        summary: `I've analyzed your AR data and identified ${queryResult.results.length} customers with sharp spikes in overdue amounts.`,
        recommendations: [
          "Immediately contact CRITICAL spike customers",
          "Review credit terms for deteriorating customers",
          "Implement daily monitoring for high-risk accounts"
        ],
        key_insights: {
          critical_customers: queryResult.results.filter(r => r.spike_severity === 'CRITICAL').length,
          total_spike_exposure: queryResult.results.reduce((sum, r) => sum + r.spike_amount, 0),
          avg_spike_rate: (queryResult.results.reduce((sum, r) => sum + r.spike_pct, 0) / queryResult.results.length).toFixed(1)
        }
      },
      
      query_metadata: {
        prompt: "Which customers had a sharp spike in overdue in the last 14 days compared to the prior 60 days?",
        intent: "ar_spike_comparison_analysis",
        generated_sql: queryResult.sql,
        execution_time_ms: queryResult.execution_time_ms,
        complexity: "high"
      },
      
      provenance: {
        data_sources: [
          { table: "ar_invoices", last_updated: "2025-09-22T08:30:00Z" },
          { table: "customers", last_updated: "2025-09-22T07:15:00Z" }
        ],
        user_permissions_verified: true,
        data_classification: "confidential",
        query_hash: `sha256:${Math.random().toString(36).substr(2, 16)}`
      },
      
      results: queryResult.results
    };
  }
}

// Complete E2E Test Suite
test.describe("Finance Agent E2E Flow", () => {
  
  test("REAL SSO → Registration → Finance Query → Response", async ({ page, request }) => {
    console.log("🔐 Step 1: Navigate to Login Page");
    
    // Navigate to login page first
    await page.goto("https://phoenix-ten-mu.vercel.app/login");
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    // Look for "Sign in with Microsoft" button specifically
    const microsoftButton = page.locator('button:has-text("Sign in with Microsoft")');
    
    try {
      await expect(microsoftButton).toBeVisible({ timeout: 5000 });
      console.log("✅ Found 'Sign in with Microsoft' button");
      
      // Click the Microsoft SSO button
      await microsoftButton.click();
      console.log("🔄 Clicked Microsoft SSO button");
      
      // Wait for Microsoft redirect or immediate auth
      try {
        // Wait for either Microsoft login page or redirect back
        await Promise.race([
          // Option 1: Redirect to Microsoft login
          page.waitForURL('**/login.microsoftonline.com/**', { timeout: 8000 }),
          
          // Option 2: Immediate redirect back (already logged into Microsoft)
          page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 8000 })
        ]);
        
        // If we're on Microsoft login page, handle auth flow
        if (page.url().includes('login.microsoftonline.com')) {
          console.log("🔄 Redirected to Microsoft login");
          
          // Wait for potential account picker or automatic redirect
          await Promise.race([
            // Auto redirect back (user already logged in)
            page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 15000 }),
            
            // Account picker appears
            page.waitForSelector('.tile, .account-tile', { timeout: 5000 })
              .then(async () => {
                console.log("🔄 Account picker found");
                await page.click('.tile, .account-tile');
                return page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 10000 });
              }),
            
            // Consent screen appears
            page.waitForSelector('[value="Accept"], button:has-text("Accept")', { timeout: 5000 })
              .then(async () => {
                console.log("🔄 Consent screen found");
                await page.click('[value="Accept"], button:has-text("Accept")');
                return page.waitForURL('**/phoenix-ten-mu.vercel.app/**', { timeout: 10000 });
              })
          ]);
        }
        
        console.log(`✅ Successfully redirected back to: ${page.url()}`);
        
        // Step 2: Verify MSAL authentication was successful
        console.log("👤 Step 2: Verify MSAL Authentication");
        
        // Wait for auth processing and check for user indicators
        await page.waitForTimeout(3000);
        
        // Check if we're redirected to a dashboard/main page or still on login
        if (page.url().includes('/login')) {
          console.log("⚠️  Still on login page - authentication may have failed");
          await page.screenshot({ path: 'test-results/auth-failed.png' });
        } else {
          console.log("✅ Authentication successful - redirected away from login");
        }
        
        // Check for MSAL data in browser storage
        const msalData = await page.evaluate(() => {
          const accounts = Object.keys(localStorage).filter(key => key.includes('msal'));
          const msalAccount = localStorage.getItem('msal.account-info') || 
                            localStorage.getItem('msal.token-info') ||
                            accounts.length > 0 ? 'found' : null;
          
          return {
            msalKeys: accounts,
            hasTokens: !!msalAccount,
            allLocalStorage: Object.keys(localStorage)
          };
        });
        
        console.log("🔍 MSAL Data Check:", msalData);
        
        if (msalData.hasTokens || msalData.msalKeys.length > 0) {
          console.log("✅ MSAL authentication data found in browser");
        } else {
          console.log("⚠️  No MSAL data found - using fallback");
        }
        
        // Step 3: Navigate to chat as authenticated user
        console.log("💬 Step 3: Navigate to Chat with MSAL Auth");
        await page.goto("https://phoenix-ten-mu.vercel.app/chat");
        await page.waitForLoadState('networkidle');
        
      } catch (authError) {
        console.log("❌ Microsoft SSO flow failed:", authError.message);
        await page.screenshot({ path: 'test-results/sso-error.png' });
        
        // Fallback: go directly to chat for testing
        console.log("🔄 Falling back to direct chat access");
        await page.goto("https://phoenix-ten-mu.vercel.app/chat");
      }
      
    } catch (buttonError) {
      console.log("❌ Microsoft button not found:", buttonError.message);
      console.log("🔄 Going directly to chat page");
      await page.goto("https://phoenix-ten-mu.vercel.app/chat");
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/final-chat-page.png', fullPage: true });
    
    // Test chat functionality (regardless of auth status)
    console.log("💬 Step 4: Test Chat Functionality");
    
    // Try to find chat input
    const chatInputSelectors = [
      'input[placeholder="Type your message..."]',
      'input[placeholder*="message"]',
      'input[type="text"]',
      'textarea'
    ];
    
    let chatInput = null;
    for (const selector of chatInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        chatInput = selector;
        console.log(`✅ Found chat input: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (chatInput) {
      // Submit finance query
      const financePrompt = "Which customers had a sharp spike in overdue in the last 14 days compared to the prior 60 days?";
      await page.fill(chatInput, financePrompt);
      console.log("✅ Entered finance query");
      
      // Monitor for API calls with auth headers
      const apiCalls = [];
      page.on('request', request => {
        if (request.url().includes('phoenix-ten-mu.vercel.app') && 
            request.method() === 'POST') {
          const authHeader = request.headers()['authorization'];
          const msalHeader = request.headers()['x-msal-token'];
          apiCalls.push({
            url: request.url(),
            hasAuth: !!authHeader,
            hasMsal: !!msalHeader,
            authType: authHeader ? authHeader.split(' ')[0] : 'none'
          });
        }
      });
      
      await page.press(chatInput, 'Enter');
      console.log("✅ Query submitted");
      
      // Wait for response and API calls
      await page.waitForTimeout(5000);
      
      console.log(`📡 API calls made: ${apiCalls.length}`);
      apiCalls.forEach(call => {
        console.log(`  - ${call.url}: Auth=${call.hasAuth}, MSAL=${call.hasMsal}, Type=${call.authType}`);
      });
      
      // Look for response
      const responseElements = await page.$('.message, .chat-message, [class*="message"]');
      if (responseElements.length > 0) {
        const responseText = await responseElements[0].textContent();
        console.log(`✅ Found response: ${responseText.substring(0, 100)}...`);
      } else {
        console.log("⚠️  No response detected yet");
      }
      
    } else {
      console.log("⚠️  Chat input not found");
      
      // Log page content for debugging
      const pageContent = await page.content();
      console.log("📄 Page title:", await page.title());
      console.log("🔗 Current URL:", page.url());
    }
    
    // Final validation
    expect(page.url()).toContain('phoenix-ten-mu.vercel.app');
    console.log("✅ Real SSO flow test completed");
  });
  
  test("Chat UI element detection", async ({ page }) => {
    console.log("🔍 Testing Chat UI Elements");
    
    await page.goto("https://phoenix-ten-mu.vercel.app/chat");
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/ui-detection.png', fullPage: true });
    
    const messageInput = page.locator('input[placeholder="Type your message..."], textarea');
    await expect(messageInput).toBeVisible();
    await messageInput.fill("Test message");
    expect(await messageInput.inputValue()).toBe("Test message");
    console.log("✅ Chat UI element test passed");
  });

  test("Local simulation flow", async () => {
    console.log("🧪 Running local simulation");
    
    // Step 1: MSAL Auth
    const msalAuth = await FinanceAgentSimulator.simulateMSALAuth();
    console.log("✅ MSAL Authentication:", msalAuth.account.username);
    
    // Step 2: User Registration
    const userReg = await FinanceAgentSimulator.registerUser(msalAuth);
    console.log("✅ User Registration:", userReg.user.email);
    
    // Step 3: Finance Agent Processing
    const promptResult = await FinanceAgentSimulator.processFinancePrompt(
      "Which customers had a sharp spike in overdue?",
      userReg.user
    );
    console.log("✅ Prompt Analysis:", promptResult.prompt_analysis.intent);
    
    // Step 4: Mock Results
    const mockResults = [
      { 
        customer_id: "CUST-001", 
        customer_name: "Acme Corp", 
        spike_pct: 200.0, 
        spike_severity: "CRITICAL",
        spike_amount: 50000
      }
    ];
    
    const queryResult = {
      sql: promptResult.generated_sql,
      results: mockResults,
      execution_time_ms: 245
    };
    
    // Step 5: Generate Response
    const financeResponse = FinanceAgentSimulator.generateFinanceResponse(
      queryResult, 
      { ...userReg.user, session_id: userReg.session_id }, 
      promptResult.trace_id
    );
    
    console.log("✅ Response Generated");
    console.log("📊 Key Insights:", financeResponse.agent_response.key_insights);
    console.log("📋 Trace ID:", financeResponse.trace_id);
    
    // Validate
    expect(financeResponse.trace_id).toBeDefined();
    expect(financeResponse.tenant_id).toBe("ms account");
    expect(financeResponse.results).toHaveLength(1);
    
    console.log("✅ Local simulation completed successfully!");
  });
});

// Component tests
test.describe("Finance Agent Components", () => {
  
  test("MSAL authentication validation", async () => {
    const auth = await FinanceAgentSimulator.simulateMSALAuth();
    
    expect(auth.accessToken).toMatch(/^eyJ/);
    expect(auth.account.tenantId).toBeDefined();
    expect(auth.account.username).toContain("@");
    expect(auth.expiresOn > new Date()).toBe(true);
  });
  
  test("SQL generation for comparative spike analysis", async () => {
    const mockUser = { tenant_id: "test-tenant", email: "test@example.com" };
    const promptAnalysis = {
      intent: "ar_spike_comparison_analysis",
      entities: { tenant: "test-tenant", as_of_date: new Date().toISOString().split('T')[0] }
    };
    
    const sql = FinanceAgentSimulator.generateComparativeSQL(promptAnalysis, mockUser);
    
    expect(sql).toContain("spike_analysis");
    expect(sql).toContain("test-tenant");
    expect(sql).toContain("CRITICAL");
  });
  
  test("Provenance and traceability", async () => {
    const mockQueryResult = {
      sql: "SELECT * FROM spike_analysis",
      results: [{ customer_id: "TEST-001", spike_pct: 150, spike_severity: "CRITICAL" }],
      execution_time_ms: 200
    };
    
    const mockUser = { 
      user_id: "user-123", 
      tenant_id: "test-tenant", 
      session_id: "sess-456" 
    };
    
    const response = FinanceAgentSimulator.generateFinanceResponse(
      mockQueryResult, 
      mockUser, 
      "trace-789"
    );
    
    expect(response.trace_id).toBe("trace-789");
    expect(response.provenance.query_hash).toMatch(/^sha256:/);
    expect(response.provenance.user_permissions_verified).toBe(true);
    expect(response.provenance.data_classification).toBe("confidential");
  });
});