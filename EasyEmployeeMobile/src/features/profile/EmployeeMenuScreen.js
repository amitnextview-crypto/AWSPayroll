import React from 'react';
import {Building2, CalendarCheck, ClipboardList, FileText, IndianRupee, LayoutDashboard, ReceiptText, Settings} from 'lucide-react-native';
import {MenuGrid} from '../../components/MenuGrid';
import {Screen} from '../../components/Screen';

export const EmployeeMenuScreen = ({navigation}) => {
  const openInfo = (title, body, kind) => navigation.navigate('Info', {title, body, kind});
  return (
    <Screen>
      <MenuGrid
        items={[
          {label: 'Dashboard', caption: 'Profile and quick status', icon: LayoutDashboard, onPress: () => navigation.navigate('Home')},
          {label: 'Team', caption: 'Assigned team and members', icon: Building2, onPress: () => navigation.navigate('EmployeeTeam')},
          {label: 'Attendance', caption: 'GPS check-in/check-out', icon: CalendarCheck, onPress: () => navigation.navigate('Attendance')},
          {label: 'Apply For Leave', caption: 'Send leave request', icon: ClipboardList, onPress: () => navigation.navigate('Leave', {mode: 'apply'})},
          {label: 'Leave Applications', caption: 'Leave request history', icon: ClipboardList, onPress: () => navigation.navigate('Leave', {mode: 'applications'})},
          {label: 'Salary', caption: 'Assigned salary details', icon: IndianRupee, onPress: () => navigation.navigate('Salary')},
          {label: 'My Monthly Salaries', caption: 'Cycle salary till date', icon: IndianRupee, onPress: () => navigation.navigate('MyMonthlySalaries')},
          {label: 'Submit Expense', caption: 'Create and track expenses', icon: ReceiptText, onPress: () => navigation.navigate('EmployeeExpenses')},
          {label: 'Settings', caption: 'Help email and number', icon: Settings, onPress: () => openInfo('Settings', 'Company help contact details are managed by admin.', 'settings')},
          {label: 'Company Policies', caption: 'Company rules and benefits', icon: FileText, onPress: () => navigation.navigate('CompanyPolicies')},
        ]}
      />
    </Screen>
  );
};
