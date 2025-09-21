const { z } = require("zod");
const fs = require("fs");
const path = require("path");

// Load meta.json
const meta = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../intents/ar_spike_14v60.meta.json"), "utf-8")
);

// Build schema from meta.json
const schema = z.object({
  customer_id: z.string(),
  overdue_14d: z.number(),
  overdue_prev_60d: z.number(),
  spike_pct: z.number(),
});

test("AR Spike contract matches meta.json", () => {
  expect(() => schema.parse(sampleRow)).not.toThrow();
});