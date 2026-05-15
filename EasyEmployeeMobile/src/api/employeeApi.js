import client from './client';

export const login = credentials => client.post('/auth/login', credentials);
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

export const getEmployeeTeam = id => client.get(`/employee/team/${id}`);
export const getEmployeeTeamMembers = id => client.get(`/employee/team/${id}/members`);
export const getEmployeeExpenses = params => client.get('/employee/expenses', {params});
export const addExpense = data => client.post('/employee/expenses', data);
export const updateExpense = (id, data) => client.patch(`/employee/expenses/${id}`, data);
export const deleteExpense = id => client.delete(`/employee/expenses/${id}`);

export const getAdminCounts = () => client.get('/admin/counts');
export const getAdminEmployees = () => client.get('/admin/employees');
export const getAdminAdmins = () => client.get('/admin/admins');
export const getAdminLeaders = () => client.get('/admin/leaders');
export const getAdminTeams = () => client.get('/admin/teams');
export const getAdminAllUsers = () => client.get('/admin/all-users');
export const getAdminTeamMembers = id => client.get(`/admin/team/${id}/members`);
export const deleteAdminUser = id => client.delete(`/admin/user/${id}`);
export const deleteAdminTeam = id => client.delete(`/admin/team/${id}`);
export const getAdminAttendance = data =>
  client.post('/admin/view-employee-attendance', data);
export const updateAdminAttendance = data =>
  client.post('/admin/update-employee-attendance', data);
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
export const getAdminSalaries = data => client.post('/admin/view-all-salary', data);
export const generateAdminMonthlySalaries = data =>
  client.post('/admin/generate-monthly-salaries', data);
export const calculateCurrentMonthSalaries = () =>
  client.get('/admin/calculate-current-month-salaries');
export const sendAdminPayslip = data => client.post('/admin/payslip/send-email', data);
export const getPayrollPolicies = () => client.get('/admin/payroll-policies');
export const updatePayrollPolicy = (id, data) =>
  client.patch(`/admin/payroll-policies/${id}`, data);
