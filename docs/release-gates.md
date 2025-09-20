# Finance Agent – Release Gate Checklist

This checklist must be completed before approving a release or merge to **main**.  
It ensures the Finance/Sales Agent meets **accuracy, safety, performance, and cost requirements**.

---

## Contract & Guardrails
- [ ] **Contract Tests** passed (curated view schema matches `.meta.json`).
- [ ] **RLS enforced**: `tenant_id` required in all queries.
- [ ] **Guardrail Tests** passed:
  - [ ] No `SELECT *`.
  - [ ] No cross-tenant joins.
  - [ ] Partition/date filters applied.

---

## End-to-End (E2E)
- [ ] All critical MVP prompts pass:
  - AR Spike Detector  
  - Revenue Acceleration  
  - Payment Latency Drift  
  - Discount Band Mix  
  - Aging Migration  
- [ ] Responses include `trace_id` and `tenant_id`.
- [ ] Provenance data is logged.

---

## Performance & Cost
- [ ] Latency within budget (p95 < 15s, max < threshold).
- [ ] Bytes scanned/query ≤ **50 MB**.
- [ ] Cost/query ≤ **$0.60** (≈₱3.42 DWU).
- [ ] Concurrency: system sustains **20–30 parallel queries** without breaching p95.
- [ ] No >10% regression vs last stable release.

---

## Security
- [ ] **ZAP baseline scan** completed (no untested skips).
- [ ] **Snyk scan** completed (no dependency vulnerabilities skipped).
- [ ] No **High** or **Critical** issues.
- [ ] Low/Medium issues logged + tracked.
- [ ] Injection and RLS bypass attempts blocked.

---

## Coverage & Quality
- [ ] Automation coverage ≥ 70%.
- [ ] CI pipeline ran all QA suites successfully.
- [ ] Defect escape log reviewed — no unresolved RCAs.
- [ ] Post-incident regressions added (if applicable).

---

## Sign-off
- QA Lead: _______________________  
- Dev/Arch Reviewer: ______________  
- Security Reviewer: ______________  
- Product Owner: _________________  

---

### Note
Gates are **blocked** unless marked as *“warnings”* in the QA Strategy doc:  
- Coverage 70–90%  
- Low/Medium security issues  
- Performance near budget  

All **blockers** must be cleared before release.