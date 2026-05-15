const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EarningsSchema = new Schema({
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    otherBenefits: { type: Number, default: 0 },
    gross: { type: Number, default: 0 }
});

const DeductionsSchema = new Schema({
    pfEmployeePercent: { type: Number, default: 12 },
    pfEmployee: { type: Number, default: 0 },
    pfEmployerPercent: { type: Number, default: 12 },
    pfEmployer: { type: Number, default: 0 },
    esiEmployeePercent: { type: Number, default: 0 },
    esiEmployee: { type: Number, default: 0 },
    esiEmployerPercent: { type: Number, default: 0 },
    esiEmployer: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    loanRecovery: { type: Number, default: 0 },
    tdsMonthly: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 }
});

const UserSalarySchema = new Schema({
    employeeID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    earnings: { type: EarningsSchema, default: () => ({}) },
    deductions: { type: DeductionsSchema, default: () => ({}) },
    netPay: { type: Number, default: 0 },
    assignedDate: { type: String, required: true },
    month: { type: String },
    year: { type: String },
    meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('UserSalary', UserSalarySchema);
