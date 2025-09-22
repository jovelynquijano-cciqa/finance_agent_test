import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Custom metric to track response size
let responseSize = new Trend('response_size_bytes');

export let options = {
  vus: 25,             // concurrency target: 20–30 virtual users
  duration: '30s',     // total test duration
  thresholds: {
    'http_req_duration': ['p(95)<15000'],  // p95 latency < 15s
    'response_size_bytes': ['p(100)<50e6'], // max 50 MB per response
    'http_req_failed': ['rate<0.01'],      // <1% failed requests
  }
};

export default function () {
  const res = http.get('https://phoenix-templated-sql-gkdug6f2aqg6eufp.southeastasia-01.azurewebsites.net/query');

  // Check response
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has results array': (r) => Array.isArray(r.json().results),
    'trace_id exists': (r) => r.json().trace_id !== undefined,
  });

  // Track response size in bytes
  responseSize.add(res.body.length);

  sleep(1); // pacing
}
