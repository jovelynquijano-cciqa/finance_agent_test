const fs = require("fs");
const path = require("path");

const sql = fs.readFileSync(
  path.join(__dirname, "../../fixtures/ar_spike_14v60.sql.tmpl"),
  "utf8"
);

describe("Guardrail Test: ar_spike_14v60", () => {
  test("SQL must include tenant_id filter", () => {
    expect(sql).toMatch(/tenant_id\s*=\s*@tenant_id/i);
  });

  test("SQL must include as_of_date filter", () => {
    expect(sql).toMatch(/as_of_date/i);
  });

  test("SQL must not use SELECT *", () => {
    expect(sql).not.toMatch(/SELECT\s+\*/i);
  });

  test("SQL must not cross tenants (no join without tenant_id)", () => {
    expect(sql).not.toMatch(/JOIN\s+\w+\s+ON\s+[^;]*tenant_id\s*=/i);
  });

  test("SQL must use partition pruning", () => {
    expect(sql).toMatch(/yyyy_mm/i);
  });
});