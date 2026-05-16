import axios from 'axios';
import { toast } from 'react-toastify';


const base = process.env.REACT_APP_BASE_URL?.replace(/\/+$/, '');
const api = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
  timeout: 30000
});


// 'http://localhost:5500/api'

//Auth
export const doLogin = data => api.post('/auth/login',data);
export const forgotPassword = data => api.post('/auth/forgot',data);
export const resetPassword = data => api.patch('/auth/reset',data);
export const dLogout = () => api.get('/auth/logout');

// Payroll Policies
export const getPayrollPolicies = () => api.get('/admin/payroll-policies');
export const addPayrollPolicy = data => api.post('/admin/payroll-policies', data);
export const updatePayrollPolicy = (id, data) => api.patch(`/admin/payroll-policies/${id}`, data);
export const deletePayrollPolicy = id => api.delete(`/admin/payroll-policies/${id}`);



//Admin
export const getCounts = () => api.get('/admin/counts');
export const getEmployees = () => api.get('/admin/employees');
export const getLeaders = () => api.get('/admin/leaders');
export const getFreeLeaders = () => api.get('/admin/leaders/free');
export const getAdmins = () => api.get('/admin/admins');
export const getTeams = () => api.get('/admin/teams');

export const getTeamMembers = data => api.get(`/admin/team/${data}/members`);
export const addUser = data => api.post('/admin/user',data);
export const updateUser = (id,data) => api.patch(`/admin/user/${id}`,data);
export const addTeam = data => api.post('/admin/team',data);
export const updateTeam = (id,data) => api.patch(`/admin/team/${id}`,data);
export const getEmployee = data => api.get(`/admin/employee/${data}`);
export const getLeader = data => api.get(`/admin/leader/${data}`);
export const getFreeEmployees = () => api.get('/admin/employees/free');
export const getTeam = data => api.get(`/admin/team/${data}`);
export const removeMember = data => api.patch('/admin/team/member/remove',data);
export const addMember = data => api.patch('/admin/team/member/add',data);
export const removeLeader = data => api.patch('/admin/team/leader/remove',data);
export const addLeader = data => api.patch('/admin/team/leader/add',data);
export const getUser = data => api.get(`/admin/user/${data}`);
export const getAttendance = data => api.post('admin/view-employee-attendance',data);
export const viewLeaves = data => api.post('admin/view-leave-applications',data);
export const updateLeave = (id,data) => api.post(`admin/update-leave/${id}`,data);
export const assignSalary = data => api.post('admin/assign-employee-salary',data);
export const updateSalary = data => api.post('admin/update-employee-salary',data);
export const viewAllSalaries = (data = {}) => api.post('/admin/view-all-salary', data);
export const generateMonthlySalaries = data => api.post('admin/generate-monthly-salaries',data);
export const deleteUser = (id) => api.delete(`/admin/user/${id}`);
export const deleteTeam = (id) => api.delete(`/admin/team/${id}`);
export const updateEmployeeAttendance = (data) => api.post('admin/update-employee-attendance', data);

// 💰 admin Expense APIs
export const viewEmployeeExpenses = (params) =>api.get("/admin/expenses", { params });
export const getExpenseById_Admin = (id) =>api.get(`/admin/expenses/${id}`);
export const updateEmployeeExpense = (id, data) =>api.patch(`/admin/expenses/${id}`, data);
export const calculateCurrentMonthSalaries = () =>
  api.get("/admin/calculate-current-month-salaries");
export const sendPayslip = (data) => api.post('/admin/payslip/send-email', data);



//Leader
export const getMembers_Leader = () => api.get('/leader/team/members');
export const getTeam_Leader = () => api.get('/leader/team/');


// Employee
export const getEmployeeTeam = data => api.get(`/employee/team/${data}`);
export const getEmployeeTeamMembers = data => api.get(`/employee/team/${data}/members`);
export const markEmployeeAttendance = data => api.post('/employee/mark-employee-attendance',data);
export const viewEmployeeAttendance = data => api.post('/employee/view-employee-attendance',data);
export const applyforleave = data => api.post('/employee/apply-leave-application',data);
export const viewLeaveApplications = data  => api.post('/employee/view-leave-applications',data);
export const viewEmployeeSalary = data => api.post('employee/view-salary',data);
//export const viewExpenseApplications = data => api.post('/employee/view-expense-applications', data);
export const checkInEmployeeAttendance = data => api.post('/employee/checkin-employee-attendance', data);
export const checkOutEmployeeAttendance = data => api.post('/employee/checkout-employee-attendance', data);
//  Admin - All Users
export const getAllUsers = () => api.get('/admin/all-users');
// 💰 Expenses
// 💰 Employee Expense APIs
export const getEmployeeExpenses = (params) =>api.get("/employee/expenses", { params });
export const addExpense = (data) =>api.post("/employee/expenses", data);
export const updateExpense = (id, data) =>api.patch(`/employee/expenses/${id}`, data);
export const deleteExpense = (id) =>api.delete(`/employee/expenses/${id}`);
export const getExpenseById = (id) =>api.get(`/employee/expenses/${id}`);



api.interceptors.response.use((response)=>{
    console.log("All Cookies",document.cookie);
    return response.data;
},(error)=>{
    console.log(error);
    if (error.response?.data) return error.response.data;
    if (error.code === 'ECONNABORTED') {
        return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Unable to connect to server. Please try again.' };
})

export default api;



