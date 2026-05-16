const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const salaryTaxRuleSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    fromAmount: { type: Number, required: true, default: 0 },
    toAmount: { type: Number, default: null },
    ratePercent: { type: Number, required: true, default: 0 },
    sortOrder: { type: Number, default: 0 },
    regime: { type: String, trim: true, default: 'New Regime' },
    financialYear: { type: String, trim: true, default: 'FY 2025-26' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

salaryTaxRuleSchema.index({ regime: 1, financialYear: 1, sortOrder: 1 });

module.exports = mongoose.model('SalaryTaxRule', salaryTaxRuleSchema, 'salarytaxrules');
