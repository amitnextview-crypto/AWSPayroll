import React from 'react';
import {Building2, CalendarCheck, ClipboardList, Info, IndianRupee, LayoutDashboard, ReceiptText, Settings} from 'lucide-react-native';
import {MenuGrid} from '../../components/MenuGrid';
import {Screen} from '../../components/Screen';

export const EmployeeMenuScreen = ({navigation}) => {
  const openInfo = (title, body) => navigation.navigate('Info', {title, body});
  return (
    <Screen>
      <MenuGrid
        items={[
          {label: 'Dashboard', caption: 'Profile and quick status', icon: LayoutDashboard, onPress: () => navigation.navigate('Home')},
          {label: 'Team', caption: 'Assigned team and members', icon: Building2, onPress: () => navigation.navigate('EmployeeTeam')},
          {label: 'Attendance', caption: 'GPS check-in/check-out', icon: CalendarCheck, onPress: () => navigation.navigate('Attendance')},
          {label: 'Apply For Leave', caption: 'Send leave request', icon: ClipboardList, onPress: () => navigation.navigate('Leave')},
          {label: 'Leave Applications', caption: 'Leave request history', icon: ClipboardList, onPress: () => navigation.navigate('Leave')},
          {label: 'Salary', caption: 'Assigned salary details', icon: IndianRupee, onPress: () => navigation.navigate('Salary')},
          {label: 'Submit Expense', caption: 'Create and track expenses', icon: ReceiptText, onPress: () => navigation.navigate('EmployeeExpenses')},
          {label: 'Settings', caption: 'App configuration', icon: Settings, onPress: () => openInfo('Settings', 'Attendance uses live location for onsite employees. Backend is connected to the hosted Render API.')},
          {label: 'Contact me', caption: 'Company contact', icon: Info, onPress: () => openInfo('Contact me', 'Company contact details can be added here.')},
          {label: 'About me', caption: 'Employee profile context', icon: Info, onPress: () => openInfo('About me', 'Your profile, attendance, leave, salary, expense, and team data are loaded from AWSPayroll backend.')},
        ]}
      />
    </Screen>
  );
};
