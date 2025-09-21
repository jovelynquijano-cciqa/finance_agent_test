const path = require("path");
const { runContractTests } = require("./validators/validate_contract");

const metaPath = path.join(__dirname, "../../fixtures/ar_spike_14v60.meta.json");

const schema = {
  customer_id: "string",
  overdue_14d: "number",
  overdue_prev_60d: "number",
  spike_pct: "number",
};

runContractTests(metaPath, schema);