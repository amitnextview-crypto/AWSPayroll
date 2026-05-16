const express = require('express');
const router = express.Router();
const controller = require('../controllers/payrollPolicyController');
const { auth, authRole } = require('../middlewares/auth-middleware');

// ✅ Only Admin role can access
router.get('/payroll-policies', auth, authRole(['admin']), controller.getPolicies);
router.post('/payroll-policies', auth, authRole(['admin']), controller.createPolicy);
router.patch('/payroll-policies/:id', auth, authRole(['admin']), controller.updatePolicy);
router.delete('/payroll-policies/:id', auth, authRole(['admin']), controller.deletePolicy);

module.exports = router;
