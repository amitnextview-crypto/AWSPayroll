import React from 'react';
import {
  Building2,
  CalendarCheck,
  FileCheck,
  FileText,
  IndianRupee,
  Info,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react-native';
import {MenuGrid} from '../../components/MenuGrid';
import {Screen} from '../../components/Screen';

export const AdminMenuScreen = ({navigation}) => {
  const openInfo = (title, body) => navigation.navigate('Info', {title, body});
  return (
    <Screen>
      <MenuGrid
        items={[
          {label: 'Dashboard', caption: 'Counts and priority actions', icon: LayoutDashboard, onPress: () => navigation.navigate('Dashboard')},
          {label: 'Employees', caption: 'Employee list and actions', icon: Users, onPress: () => navigation.navigate('AdminPeople', {filter: 'employees'})},
          {label: 'Leaders', caption: 'Leader list and actions', icon: ShieldCheck, onPress: () => navigation.navigate('AdminPeople', {filter: 'leaders'})},
          {label: 'Admins', caption: 'Admin users', icon: ShieldCheck, onPress: () => navigation.navigate('AdminPeople', {filter: 'admins'})},
          {label: 'Add Team', caption: 'Create a team with leader', icon: Plus, onPress: () => navigation.navigate('AdminAddTeam')},
          {label: 'Teams', caption: 'Team records and bulk members', icon: Building2, onPress: () => navigation.navigate('AdminTeams')},
          {label: 'Attendance', caption: 'View employee attendance', icon: CalendarCheck, onPress: () => navigation.navigate('AdminAttendance')},
          {label: 'Leaves', caption: 'Approve or reject leave', icon: FileCheck, onPress: () => navigation.navigate('AdminLeaves')},
          {label: 'Expenses', caption: 'Approve or reject expense', icon: ReceiptText, onPress: () => navigation.navigate('AdminExpenses')},
          {label: 'Assign Salary', caption: 'Assign employee salary', icon: WalletCards, onPress: () => navigation.navigate('AdminAssignSalary')},
          {label: 'Salaries', caption: 'Salary records', icon: IndianRupee, onPress: () => navigation.navigate('AdminSalaries')},
          {label: 'Monthly Salaries', caption: 'Generate current month', icon: IndianRupee, onPress: () => navigation.navigate('AdminSalaries')},
          {label: 'Add User', caption: 'Create employee/admin/leader', icon: UserPlus, onPress: () => navigation.navigate('AdminAddUser')},
          {label: 'Payroll Policies', caption: 'Tax and payroll rules', icon: FileText, onPress: () => navigation.navigate('AdminPolicies')},
          {label: 'Settings', caption: 'Theme and preferences', icon: Settings, onPress: () => navigation.navigate('AdminSettings')},
          {label: 'Contact Us', caption: 'Support details', icon: Info, onPress: () => openInfo('Contact Us', 'Amit Web Solution Company\nEmail: amitwebsolutioncompany@gmail.com\nPhone: 8574700615\n\nSupport: report payroll, attendance, leave, salary slip, or login issues with employee ID and screenshots.\nApp Version: 1.0.0')},
          {label: 'About Us', caption: 'Company profile', icon: Info, onPress: () => openInfo('About Us', 'AWSPayroll is a payroll, attendance, leave, expense, and team management app.')},
        ]}
      />
    </Screen>
  );
};
