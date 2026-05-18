const router = require("express").Router();
const asyncMiddleware = require("../middlewares/async-middleware");
const userController = require("../controllers/user-controller");
const teamController = require("../controllers/team-controller");
const upload = require("../services/file-upload-service");
const expenseController = require("../controllers/expenseController");
const payrollPolicyController = require("../controllers/payrollPolicyController");

router.post(
    "/user",
    upload.single("profile"),
    asyncMiddleware(userController.createUser)
); // Create User

router.patch(
    "/user",
    upload.single("profile"),
    asyncMiddleware(userController.updateUser)
); // Update Self Account
router.get("/team/:id", asyncMiddleware(teamController.getTeam));
router.get("/team/:id/members", asyncMiddleware(teamController.getTeamMembers));
router.get("/company-settings", asyncMiddleware(userController.getCompanySettings));
router.get("/office-locations", asyncMiddleware(userController.getOfficeLocations));
router.get("/payroll-policies", asyncMiddleware(payrollPolicyController.getPolicies));
router.post(
    "/mark-employee-attendance",
    asyncMiddleware(userController.markEmployeeAttendance)
);
router.post(
    "/view-employee-attendance",
    asyncMiddleware(userController.viewEmployeeAttendance)
);
router.post(
    "/apply-leave-application",
    asyncMiddleware(userController.applyLeaveApplication)
);
router.post(
    "/view-leave-applications",
    asyncMiddleware(userController.viewLeaveApplications)
);
router.post("/view-salary", asyncMiddleware(userController.viewSalary));
router.get("/monthly-salary", asyncMiddleware(userController.calculateMyMonthlySalary));
router.get("/monthly-salaries", asyncMiddleware(userController.calculateMyMonthlySalaryList));
router.post(
    "/checkin-employee-attendance",
    asyncMiddleware(userController.checkInEmployeeAttendance)
);
router.post(
    "/checkout-employee-attendance",
    asyncMiddleware(userController.checkOutEmployeeAttendance)
);
// 💰 Expenses

// 💰 Employee Expense APIs
router.post(
  "/expenses",
  upload.single("billAttachment"),
  asyncMiddleware(expenseController.addExpense)
);

router.get("/expenses", asyncMiddleware(expenseController.getExpenses));
router.get("/expenses/:id", asyncMiddleware(expenseController.getExpenseById));
router.patch("/expenses/:id", asyncMiddleware(expenseController.updateExpense));
router.delete("/expenses/:id", asyncMiddleware(expenseController.deleteExpense));

module.exports = router;
