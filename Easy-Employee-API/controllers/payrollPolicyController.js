// controllers/payrollPolicyController.js
const payrollPolicyService = require('../services/payrollPolicyService');

class PayrollPolicyController {
  // 🔹 Get all payroll policies
  async getPolicies(req, res, next) {
    try {
      const policies = await payrollPolicyService.getAll();
      res.json({ success: true, data: policies });
    } catch (err) {
      console.error("Get policies error:", err);
      next(err);
    }
  }

  // 🔹 Update a payroll policy
  async updatePolicy(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await payrollPolicyService.updatePolicy(id, data);
      if (!updated)
        return res.status(404).json({ success: false, message: "Policy not found" });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error("Update policy error:", err);
      next(err);
    }
  }
}

module.exports = new PayrollPolicyController();
