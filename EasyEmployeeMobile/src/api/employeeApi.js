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
