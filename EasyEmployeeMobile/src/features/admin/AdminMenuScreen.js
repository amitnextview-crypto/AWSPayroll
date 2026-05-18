import React from 'react';
import {
  Building2,
  CalendarCheck,
  FileCheck,
  FileText,
  IndianRupee,
  Info,
  LayoutDashboard,
  MapPin,
  Plus,
  ReceiptText,
  Settings,
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
          {label: 'Attendance', caption: 'View employee attendance', icon: CalendarCheck, onPress: () => navigation.navigate('AdminAttendance')},
          {label: 'Add Employee', caption: 'Create employee/admin/leader', icon: UserPlus, onPress: () => navigation.navigate('AdminAddUser')},
          {label: 'Employees', caption: 'Employees, leaders, and admins', icon: Users, onPress: () => navigation.navigate('AdminPeople')},
          {label: 'Add Team', caption: 'Create a team with leader', icon: Plus, onPress: () => navigation.navigate('AdminAddTeam')},
          {label: 'Teams', caption: 'Team records and bulk members', icon: Building2, onPress: () => navigation.navigate('AdminTeams')},
          {label: 'Assign Salary', caption: 'Assign employee salary', icon: WalletCards, onPress: () => navigation.navigate('AdminAssignSalary')},
          {label: 'Salaries', caption: 'Salary records', icon: IndianRupee, onPress: () => navigation.navigate('AdminSalaries')},
          {label: 'Monthly Salaries', caption: 'Monthly payroll records', icon: IndianRupee, onPress: () => navigation.navigate('AdminSalaries')},
          {label: 'Leaves', caption: 'Approve or reject leave', icon: FileCheck, onPress: () => navigation.navigate('AdminLeaves')},
          {label: 'Expenses', caption: 'Approve or reject expense', icon: ReceiptText, onPress: () => navigation.navigate('AdminExpenses')},
          {label: 'Office Location', caption: 'Check-in radius and office coordinates', icon: MapPin, onPress: () => navigation.navigate('AdminOfficeLocation')},
          {label: 'Payroll Policies', caption: 'Master salary and payroll rules', icon: FileText, onPress: () => navigation.navigate('AdminPolicies')},
          {label: 'Settings', caption: 'Theme and preferences', icon: Settings, onPress: () => navigation.navigate('AdminSettings')},
          {label: 'Contact Us', caption: 'Support details', icon: Info, onPress: () => openInfo('Contact Us', 'Amit Web Solution Company\nEmail: amitwebsolutioncompany@gmail.com\nPhone: 8574700615\n\nSupport: report payroll, attendance, leave, salary slip, or login issues with employee ID and screenshots.\nApp Version: 1.0.0')},
        ]}
      />
    </Screen>
  );
};
