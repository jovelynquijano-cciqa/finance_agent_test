module.exports = (templateId, params) => {
  if (templateId === 'ar_aging') {
    return `SELECT customer_id, overdue_14d FROM curated_ar
            WHERE tenant_id='${params.tenant_id}' AND as_of_date BETWEEN '2025-01-01' AND '2025-01-31'`;
  }
  throw new Error('unknown template');
};