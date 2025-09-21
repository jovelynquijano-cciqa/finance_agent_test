const { z } = require("zod");
const fs = require("fs");
const path = require("path");

// Load meta.json
const meta = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../fixtures/ar_spike_14v60.meta.json"), "utf-8")
);

// Build schema from meta.json
const schema = z.object({
  customer_id: z.string(),
  overdue_14d: z.number(),
  overdue_prev_60d: z.number(),
  spike_pct: z.number(),
});

test("AR Spike - validates meta.json structure", () => {
  // Check required filters exist
  expect(meta.required_filters).toBeDefined();
  expect(Array.isArray(meta.required_filters)).toBe(true);
  expect(meta.required_filters.length).toBeGreaterThan(0);
  
  // Check projected columns exist
  expect(meta.projected_columns).toBeDefined();
  expect(Array.isArray(meta.projected_columns)).toBe(true);
  expect(meta.projected_columns.length).toBeGreaterThan(0);
  
  // Check partitions exist
  expect(meta.partitions).toBeDefined();
  expect(Array.isArray(meta.partitions)).toBe(true);
});

test("AR Spike - enforces tenant scoping (RLS)", () => {
  // Validate that tenant_id is in required filters (Row Level Security)
  expect(meta.required_filters).toContain("tenant_id");
});

test("AR Spike - validates required filters", () => {
  const expectedFilters = ["tenant_id", "as_of_date"];
  
  expectedFilters.forEach(filter => {
    expect(meta.required_filters).toContain(filter);
  });
});

test("AR Spike - validates projected columns match schema", () => {
  const schemaKeys = Object.keys(schema.shape);
  const projectedColumns = meta.projected_columns;
  
  // All projected columns should have schema definitions
  projectedColumns.forEach(column => {
    expect(schemaKeys).toContain(column);
  });
  
  // All schema keys should be in projected columns
  schemaKeys.forEach(key => {
    expect(projectedColumns).toContain(key);
  });
});

test("AR Spike - validates partitions structure", () => {
  // Check that partitions are properly defined
  expect(meta.partitions).toContain("yyyy_mm");
  
  // Validate partition format
  meta.partitions.forEach(partition => {
    expect(typeof partition).toBe("string");
    expect(partition.length).toBeGreaterThan(0);
  });
});

test("AR Spike - validates template_id is properly set", () => {
  expect(meta.template_id).toBe("ar_spike_14v60");
});