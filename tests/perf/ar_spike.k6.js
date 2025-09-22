import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom metrics
let responseSize = new Trend('response_size_bytes');
let apiErrors = new Counter('api_errors');
let resultCount = new Trend('result_count');

export let options = {
  vus: 25,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(95)<15000', 'p(99)<20000'],  // Added p99
    'response_size_bytes': ['p(100)<50e6'],
    'http_req_failed': ['rate<0.01'],
    'result_count': ['p(50)>0'],  // Ensure we're getting results
    'api_errors': ['count<5'],    // Track API-level errors
  },
  // Add more sophisticated load patterns
  stages: [
    { duration: '5s', target: 5 },   // Ramp up
    { duration: '20s', target: 25 }, // Steady state
    { duration: '5s', target: 0 },   // Ramp down
  ]
};

export default function () {
  // Add request headers if needed
  const params = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test/1.0'
    },
    timeout: '20s'  // Explicit timeout
  };

  const res = http.get('https://phoenix-templated-sql-gkdug6f2aqg6eufp.southeastasia-01.azurewebsites.net/query');

  // Enhanced response validation
  const checksResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 15s': (r) => r.timings.duration < 15000,
    'has valid JSON': (r) => {
      try {
        r.json();
        return true;
      } catch {
        return false;
      }
    },
    'has results array': (r) => {
      try {
        const data = r.json();
        return Array.isArray(data.results);
      } catch {
        return false;
      }
    },
    'trace_id exists': (r) => {
      try {
        const data = r.json();
        return data.trace_id !== undefined && data.trace_id !== null;
      } catch {
        return false;
      }
    },
    'results not empty': (r) => {
      try {
        const data = r.json();
        return Array.isArray(data.results) && data.results.length > 0;
      } catch {
        return false;
      }
    }
  });

  // Track custom metrics
  responseSize.add(res.body.length);
  
  // Track result count if response is valid
  try {
    const data = res.json();
    if (Array.isArray(data.results)) {
      resultCount.add(data.results.length);
    }
  } catch {
    apiErrors.add(1);
  }

  // Log errors for debugging (in non-production environments)
  if (res.status !== 200) {
    console.log(`Request failed: ${res.status} - ${res.body}`);
  }

  sleep(1);
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting load test...');
  // Could add authentication setup, test data preparation, etc.
}

// Teardown function (runs once after test)
export function teardown(data) {
  console.log('Load test completed');
}