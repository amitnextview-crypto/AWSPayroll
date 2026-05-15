const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payrollPolicySchema = new Schema(
  {
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      default: "68f2175ef3cbd088402d158e", // Amit Admin
    },

    title: { type: String, required: true, trim: true, default: "Company Payroll Policy" },

    salaryRules: {
      // ✅ Base approval rule (policy itself)
      adminResponse: {
        type: String,
        enum: ["approved", "rejected", "pending"],
        default: "approved",
      },

      // ✅ Working days per month
      workingDaysInMonth: {
        type: Number,
        default: 26,
      },

      // ✅ Paid Leaves (earning day included here)
      payForApprovedLeaves: {
        enabled: { type: String, enum: ["Yes", "No"], default: "Yes" },
        condition: {
          status: { type: String, enum: ["Approved", "Rejected", "Pending"], default: "Approved" },
        },
        description: {
          type: String,
          default: "Approved leaves (including earning day) will be treated as paid.",
        },
      },

      // ✅ Approved Expenses
      payForExpenses: {
        enabled: { type: String, enum: ["Yes", "No"], default: "Yes" },
        condition: {
          status: { type: String, enum: ["Approved", "Rejected", "Pending"], default: "Approved" },
        },
        description: {
          type: String,
          default: "Approved expenses may be reimbursed or included in salary.",
        },
      },
      // ✅ Festival Holidays
      festivalHolidays: {
        enabled: { type: String, enum: ["Yes", "No"], default: "Yes" },
        days: [{ type: Date }],
        description: { type: String, default: "Festival holidays will be paid." },
      },

      // ✅ International Holidays
      internationalHolidays: {
        enabled: { type: String, enum: ["Yes", "No"], default: "Yes" },
        days: [{ type: Date }],
        description: { type: String, default: "International holidays will be paid." },
      },

      // ✅ Half-Day Rule
      halfDayRule: {
        enabled: { type: String, enum: ["Yes", "No"], default: "Yes" },
        fraction: { type: Number, default: 0.5 },
        description: { type: String, default: "Half day will be paid as 50% of daily salary." },
      },
    },

    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayrollPolicy", payrollPolicySchema, "payrollpolicies");
