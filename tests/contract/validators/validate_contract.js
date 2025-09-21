const { z } = require("zod");
const fs = require("fs");

function runContractTests(metaPath, schema) {
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

  describe(`${meta.template_id} - Contract Tests`, () => {
    test("validates meta.json structure", () => {
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

    test("enforces tenant scoping (RLS)", () => {
    // Validate that tenant_id is in required filters (Row Level Security)
    expect(meta.required_filters).toContain("tenant_id");
    });

    test("validates required filters", () => {
    const expectedFilters = ["tenant_id", "as_of_date"];
    
    expectedFilters.forEach(filter => {
        expect(meta.required_filters).toContain(filter);
    });
    });

    test("validates projected columns match schema", () => {
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

    test("validates partitions structure", () => {
    // Check that partitions are properly defined
    expect(meta.partitions).toContain("yyyy_mm");
    
    // Validate partition format
    meta.partitions.forEach(partition => {
        expect(typeof partition).toBe("string");
        expect(partition.length).toBeGreaterThan(0);
    });
    });

    test("validates template_id is properly set", () => {
      expect(meta.template_id).toBeDefined();
      expect(meta.template_id.length).toBeGreaterThan(0);
    });
  });
}

module.exports = { runContractTests };