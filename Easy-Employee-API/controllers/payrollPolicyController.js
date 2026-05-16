const mongoose = require('mongoose');
const payrollPolicyService = require('../services/payrollPolicyService');

const normalizeRules = rules => {
  if (Array.isArray(rules)) {
    return rules
      .map(rule => ({
        label: String(rule.label || '').trim(),
        value: String(rule.value || '').trim(),
        note: String(rule.note || '').trim(),
      }))
      .filter(rule => rule.label && rule.value);
  }
  return [];
};

const normalizePayload = body => ({
  title: String(body.title || '').trim(),
  category: String(body.category || 'General').trim(),
  description: String(body.description || '').trim(),
  status: body.status || 'active',
  sortOrder: Number(body.sortOrder || 0),
  rules: normalizeRules(body.rules),
  isDefault: Boolean(body.isDefault),
  meta: body.meta || {},
});

class PayrollPolicyController {
  async getPolicies(req, res, next) {
    try {
      const policies = await payrollPolicyService.getAll(req.query);
      res.json({ success: true, data: policies });
    } catch (err) {
      next(err);
    }
  }

  async createPolicy(req, res, next) {
    try {
      const data = normalizePayload(req.body);
      data.adminID = req.user?._id;
      if (!data.title) return res.status(400).json({ success: false, message: 'Policy title is required' });
      if (!data.rules.length) return res.status(400).json({ success: false, message: 'At least one policy rule is required' });
      const created = await payrollPolicyService.createPolicy(data);
      res.status(201).json({ success: true, message: 'Policy created successfully', data: created });
    } catch (err) {
      next(err);
    }
  }

  async updatePolicy(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid policy id' });
      }
      const data = normalizePayload(req.body);
      if (!data.title) return res.status(400).json({ success: false, message: 'Policy title is required' });
      if (!data.rules.length) return res.status(400).json({ success: false, message: 'At least one policy rule is required' });
      const updated = await payrollPolicyService.updatePolicy(id, data);
      if (!updated) return res.status(404).json({ success: false, message: 'Policy not found' });
      res.json({ success: true, message: 'Policy updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deletePolicy(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid policy id' });
      }
      const deleted = await payrollPolicyService.deletePolicy(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Policy not found' });
      res.json({ success: true, message: 'Policy deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PayrollPolicyController();
