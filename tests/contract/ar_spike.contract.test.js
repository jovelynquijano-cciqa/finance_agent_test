const { z } = require("zod");
const meta = require("../../fixtures/ar_spike_14v60.meta.json");

describe("Contract Test: ar_spike_14v60", () => {
  test("Includes required filters (tenant_id, as_of_date)", () => {
    expect(meta.required_filters).toEqual(
      expect.arrayContaining(["tenant_id", "as_of_date"])
    );
  });

  test("Includes correct projected columns", () => {
    const expectedColumns = [
      "customer_id",
      "overdue_14d",
      "overdue_prev_60d",
      "spike_pct"
    ];
    expect(meta.projected_columns.sort()).toEqual(expectedColumns.sort());
  });

  test("Enforces partitioning (yyyy_mm)", () => {
    expect(meta.partitions).toContain("yyyy_mm");
  });
});