const PayrollPolicyModel = require('../models/payroll-policy-model');

class PayrollPolicyService {
  // Get all policies
  getAll = async () => {
    return await PayrollPolicyModel.find().sort({ createdAt: -1 });
  };

  // Create a new policy
  createPolicy = async (data) => {
    return await PayrollPolicyModel.create(data);
  };

  // Update existing policy
  updatePolicy = async (id, data) => {
    const updated = await PayrollPolicyModel.findByIdAndUpdate(id, data, { new: true });
    return updated;
  };
}

module.exports = new PayrollPolicyService();
