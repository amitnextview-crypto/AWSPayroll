import client from './client';

export const login = credentials => client.post('/auth/login', credentials);
export const forgotPassword = data => client.post('/auth/forgot', data);
export const resetPassword = data => client.patch('/auth/reset', data);
export const refreshSession = () => client.get('/auth/refresh');
export const logout = () => client.get('/auth/logout');

export const getAttendance = data =>
  client.post('/employee/view-employee-attendance', data);

export const checkInAttendance = data =>
  client.post('/employee/checkin-employee-attendance', data);

export const checkOutAttendance = data =>
  client.post('/employee/checkout-employee-attendance', data);

export const applyLeave = data =>
  client.post('/employee/apply-leave-application', data);

export const getLeaveApplications = data =>
  client.post('/employee/view-leave-applications', data);

export const getSalary = data => client.post('/employee/view-salary', data);
export const getMyMonthlySalary = params =>
  client.get('/employee/monthly-salary', {params});
export const getMyMonthlySalaries = params =>
  client.get('/employee/monthly-salaries', {params});

export const getEmployeeTeam = id => client.get(`/employee/team/${id}`);
export const getEmployeeTeamMembers = id => client.get(`/employee/team/${id}/members`);
export const getEmployeeExpenses = params => client.get('/employee/expenses', {params});
export const addExpense = data => client.post('/employee/expenses', data);
export const updateExpense = (id, data) => client.patch(`/employee/expenses/${id}`, data);
export const deleteExpense = id => client.delete(`/employee/expenses/${id}`);

export const getAdminCounts = () => client.get('/admin/counts');
export const getAdminDashboard = () => client.get('/admin/dashboard');
export const getOfficeLocations = () => client.get('/admin/office-locations');
export const getEmployeeOfficeLocations = () => client.get('/employee/office-locations');
export const addOfficeLocation = data => client.post('/admin/office-locations', data);
export const updateOfficeLocation = (id, data) => client.patch(`/admin/office-locations/${id}`, data);
export const deleteOfficeLocation = id => client.delete(`/admin/office-locations/${id}`);
export const getAdminEmployees = params => client.get('/admin/employees', {params});
export const getAdminAdmins = params => client.get('/admin/admins', {params});
export const getAdminLeaders = params => client.get('/admin/leaders', {params});
export const getAdminTeams = () => client.get('/admin/teams');
export const getAdminAllUsers = params => client.get('/admin/all-users', {params});
export const updateAdminUser = (id, data) => client.patch(`/admin/user/${id}`, data);
export const getAdminTeamMembers = id => client.get(`/admin/team/${id}/members`);
export const addAdminUser = data => client.post('/admin/user', data);
export const addAdminTeam = data => client.post('/admin/team', data);
export const deleteAdminUser = id => client.delete(`/admin/user/${id}`);
export const deleteAdminTeam = id => client.delete(`/admin/team/${id}`);
export const addAdminTeamMember = data => client.patch('/admin/team/member/add', data);
export const removeAdminTeamMember = data => client.patch('/admin/team/member/remove', data);
export const changeAdminTeamLeader = data => client.patch('/admin/team/leader/add', data);
export const removeAdminTeamLeader = data => client.patch('/admin/team/leader/remove', data);
export const getAdminAttendance = data =>
  client.post('/admin/view-employee-attendance', data);
export const updateAdminAttendance = data =>
  client.post('/admin/update-employee-attendance', data);
export const deleteAdminAttendance = id =>
  client.delete(`/admin/attendance/${id}`);
export const getAdminLeaves = data =>
  client.post('/admin/view-leave-applications', data);
export const updateAdminLeave = (id, data) =>
  client.post(`/admin/update-leave/${id}`, data);
export const getAdminExpenses = params => client.get('/admin/expenses', {params});
export const updateAdminExpense = (id, data) =>
  client.patch(`/admin/expenses/${id}`, data);
export const assignAdminSalary = data =>
  client.post('/admin/assign-employee-salary', data);
export const updateAdminSalary = data =>
  client.post('/admin/update-employee-salary', data);
export const deleteAdminSalary = id => client.delete(`/admin/salary/${id}`);
export const getAdminSalaries = data => client.post('/admin/view-all-salary', data);
export const generateAdminMonthlySalaries = data =>
  client.post('/admin/generate-monthly-salaries', data);
export const calculateCurrentMonthSalaries = params =>
  client.get('/admin/calculate-current-month-salaries', {params});
export const exportAdminMonthlySalaries = params =>
  client.get('/admin/monthly-salaries/export', {params, responseType: 'arraybuffer'});
export const sendAdminPayslip = data => client.post('/admin/payslip/send-email', data);
export const getSalaryTaxRules = () => client.get('/admin/salary-tax-rules');
export const addSalaryTaxRule = data => client.post('/admin/salary-tax-rules', data);
export const updateSalaryTaxRule = (id, data) =>
  client.patch(`/admin/salary-tax-rules/${id}`, data);
export const deleteSalaryTaxRule = id => client.delete(`/admin/salary-tax-rules/${id}`);
export const getPayrollPolicies = () => client.get('/admin/payroll-policies');
export const addPayrollPolicy = data => client.post('/admin/payroll-policies', data);
export const updatePayrollPolicy = (id, data) =>
  client.patch(`/admin/payroll-policies/${id}`, data);
export const deletePayrollPolicy = id => client.delete(`/admin/payroll-policies/${id}`);
export const getEmployeePayrollPolicies = () => client.get('/employee/payroll-policies');
export const getCompanySettings = () => client.get('/employee/company-settings');
export const getAdminCompanySettings = () => client.get('/admin/company-settings');
export const updateAdminCompanySettings = data =>
  client.patch('/admin/company-settings', data);
