# QA Strategy

## Scope
QA covers all layers of the Finance/Sales Agent runtime: **accuracy, safety, reliability, performance, and cost compliance**.

---

## Test Types

### Contract Tests
- Validate `.meta.json`: required filters, projected columns, partitions.
- Enforce tenant scoping (RLS).

### Template & Guardrail Tests
- Ensure rendered SQL includes required clauses (`tenant_id`, bounded dates, partition prune).
- Deny unsafe constructs (`SELECT *`, cross-tenant joins).

### End-to-End (E2E) Tests
- Simulate `prompt → SQL → response` for 5 MVP workflows.
- Verify `trace_id` + provenance in results.

### UI / Frontend / Telemetry Tests
- Validate Chat UI, SSE display, tenant picker, error/clarify UX.
- Ensure telemetry completeness ≥ 98%, trace_id copyable, correct UX behavior.

### Performance/Cost Tests
- Validate latency, bytes scanned, cost/query, and concurrency.
- Compare against last stable release → fail if >10% regression.

**Targets (confirmed by Dev/Arch):**
- p95 latency < **15s**
- Max bytes scanned/query ≤ **50 MB**
- Max cost/query ≤ **$0.060** (₱3.42)
- Concurrency: sustain **20–30** parallel queries

### Security Tests
- Injection attempts, RLS bypass, wildcard enforcement.
- Block release on severity cutoff = **High + Critical**.

---

## Test Layers & Responsibilities

| Test Layer | What It Validates | Primary Owner(s) | QA Role | Notes |
|------------|------------------|------------------|---------|-------|
| Contract   | Schema drift, RLS enforced | Nitish | Enforce | CI nightly + on merge |
| Guardrail  | Tenant/date filters, safe SQL | Nate | Enforce | Blocks PRs |
| E2E        | Prompt → answer correctness & structure; backend metrics, trace_id, provenance | Eugene / Edu | Automate | Staging tests |
| UI / Telemetry | Chat UI, SSE display, tenant picker, error UX, telemetry completeness ≥ 98%, trace_id | Lenard | Automate / Consulted | QA validates trace_id, telemetry, UI behaviors |
| Perf / Cost | Latency, bytes scanned, concurrency vs budget | Nolan / Nate | Measure | Pre-prod load env |
| Security   | Guardrail bypass, injection, PII leaks | Nate / Nel | Enforce | Staging + pre-prod |
| QA Gate / Release Decision | Overall readiness, UAT, automation coverage, defect triage | Jovie | Owns & enforces | Tracks metrics, defect escapes; signs off |

---

## Tooling

| Layer            | Primary Tool      | Optional / Supplement |
|------------------|------------------|-----------------------|
| Unit/API         | Jest             | Supertest |
| Security         | OWASP ZAP        | Snyk |
| E2E              | Playwright       | - |
| Performance      | K6               | - |
| Guardrails       | Jest matchers    | - |
| Schema Validation| Zod              | - |
| CI/CD            | GitHub Actions   | - |

---

## Release Gates

A PR/merge or release may **proceed only if**:
- Contract tests pass (schema, RLS)
- Guardrail tests pass (safe SQL)
- E2E smoke & critical tests pass (includes `trace_id`, `tenant_id`)
- UI / Frontend tests pass (telemetry ≥ 98%, SSE, error/clarify UX)
- Performance tests within thresholds (latency, bytes, cost, concurrency; ≤10% regression)
- Security scans complete with no High + Critical issues
- Automation coverage ≥ 70%
- CI pipeline runs all QA suites successfully

**Warnings (release allowed, must be tracked):**
- Coverage 70–90%
- Low/Medium security issues
- Performance within 90–100% of budget

---

## Metrics & KPIs

### Automation Coverage
- Target: ≥ 90% (MVP), 100% (M2)
- Applies across Contract, Guardrail, E2E
- Enforced via CI; failure blocks release

### Performance & Cost
- Latency: p50, p95, max (p95 < 15s)
- Bytes Scanned: ≤ 50 MB/query
- Cost per Query: ≤ $0.60/query (~₱3.42 DWU)
- Concurrency: 20–30 parallel queries
- Measured via K6; >10% regression blocks release

### Security
- No High/Critical severity issues (OWASP ZAP, Snyk)
- Security enforcement integrated with release gates

### MTTR (P1 defects)
- ≤ 2h (M1), ≤ 1h (M3)

### Defect Escape Rate
- % of defects missed by QA automation but found in staging/prod  
- **Formula:** `(Escapes ÷ Total Defects) × 100`  
- Targets: ≤ 10% (M1), ≤ 5% (M2), ≤ 3% (M3)  
- RCA required for every escape; regression test must be added

---

## Defect Escape Definition

**Count as Defect Escapes (QA Misses):**
- Schema/Contract issues (e.g. column missing/wrong type)
- Guardrail violations (e.g. missing tenant_id filter)
- Functional/E2E errors (e.g. wrong metric in SQL pipeline)
- Performance regressions (e.g. p95 > threshold)
- Security misses (e.g. injection succeeds)

**Do Not Count as Defect Escapes:**
- Infra downtime or capacity issues (belongs to infra/ops)
- Unclear/missing requirements (trace back to backlog refinement)
- Data quality issues from source systems
- Telemetry gaps (infra misconfig)
- Exploratory UX feedback (outside QA scope)

---

## Reporting & Cadence
- **Daily:** QA test results reviewed at stand-up
- **Weekly:** QA dashboard shared (coverage, escapes, perf, security)
- **Post-incident:** RCA (Root Cause Analysis) within 48h; regression test added

---

## Prompt QA Matrix

| Prompt | What to Test | How to Test |
|--------|--------------|-------------|
| **AR Spike Detector (14d vs 60d)** | tenant_id, as_of_date, bounded windows, partition prune, output fields | Contract: validate `.meta.json`; Guardrail: SQL contains tenant_id+dates; E2E: stub overdue → spike_pct ≥ 0.5 |
| **At-Risk Invoices** | tenant_id, as_of_date, due_in_days=7; ratio logic | Contract: schema check; Guardrail: enforce ratio; E2E: unpaid invoices only |
| **Revenue Acceleration (7d vs 28d)** | tenant_id, as_of_date, bounded windows; GMV fields | Contract: .meta.json; Guardrail: bounded date; E2E: stub GMV growth → accel_pct ≥ 0.25 |
| **Large-Order Outliers (Z-score)** | tenant_id, from/to dates, z=3 | Contract: schema; Guardrail: no SELECT *; E2E: stub → Z>3 flagged |
| **Cash-Back Liability Velocity** | tenant_id, as_of_date, window_days=30 | Contract: schema; Guardrail: enforce window; E2E: liability Δ≥X |
| **Payment Latency Drift** | tenant_id, as_of_date, weeks=8 | Contract: schema; Guardrail: partition prune; E2E: stub drift ≥ 5d flagged |
| **Freight Heavy Orders** | tenant_id, date; ratio ≥ 15% | Contract: schema; Guardrail: ratio logic; E2E: freight/net ≥ 0.15 |
| **Discount Band Mix (90d)** | tenant_id, as_of_date, window_days=90 | Contract: schema; Guardrail: enforce banding; E2E: all bands present |
| **Cash-Back Redemption Ratio Trend** | tenant_id, as_of_date, weeks=12 | Contract: schema; Guardrail: bounded window; E2E: redemption/accrual trend |
| **Aging Migration to 61+ WoW** | tenant_id, as_of_date, weeks=8 | Contract: schema; Guardrail: partition filter; E2E: AR migration flagged |

---

## Glossary
- **RCA** = Root Cause Analysis  
- **RLS** = Row-Level Security  
- **SSE** = Server-Sent Events (streaming updates in UI)  
- **P95 latency** = 95th percentile latency (95% of queries should be faster than this threshold)  
- **DWU** = Data Warehouse Unit (Synapse cost measure)  

---
