const express = require('express');
const sample = require('./ar_aging_sample_response.json');

const app = express();

app.get('/mock/agent/ar_aging', (req, res) => {
  res.json({
    trace_id: `t-${Date.now()}`,
    tenant_id: req.query.tenant_id || 'qa1',
    results: sample
  });
});

app.listen(3000, () => console.log('Mock server running on http://localhost:3000'));