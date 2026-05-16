const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payrollPolicySchema = new Schema(
  {
    adminID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    description: { type: String, trim: true, default: "" },
    rules: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        note: { type: String, trim: true, default: "" },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    isDefault: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

payrollPolicySchema.index({ category: 1, status: 1 });
payrollPolicySchema.index({ title: "text", category: "text", "rules.label": "text", "rules.value": "text" });

module.exports = mongoose.model("PayrollPolicy", payrollPolicySchema, "payrollpolicies");
