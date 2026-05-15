import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  Home,
  IndianRupee,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react-native';
import {LoginScreen} from '../features/auth/LoginScreen';
import {AdminHomeScreen} from '../features/admin/AdminHomeScreen';
import {AdminExpensesScreen} from '../features/admin/AdminExpensesScreen';
import {AdminLeavesScreen} from '../features/admin/AdminLeavesScreen';
import {AdminPeopleScreen} from '../features/admin/AdminPeopleScreen';
import {AdminPoliciesScreen} from '../features/admin/AdminPoliciesScreen';
import {AdminSalaryScreen} from '../features/admin/AdminSalaryScreen';
import {AdminTeamsScreen} from '../features/admin/AdminTeamsScreen';
import {AttendanceScreen} from '../features/attendance/AttendanceScreen';
import {ExpenseScreen} from '../features/expenses/ExpenseScreen';
import {LeaveScreen} from '../features/leave/LeaveScreen';
import {HomeScreen} from '../features/profile/HomeScreen';
import {ProfileScreen} from '../features/profile/ProfileScreen';
import {SalaryScreen} from '../features/salary/SalaryScreen';
import {EmployeeTeamsScreen} from '../features/teams/EmployeeTeamsScreen';
import {restoreSession} from '../store/authSlice';
import {colors} from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Dashboard: LayoutDashboard,
  Home: Home,
  Attendance: CalendarCheck,
  Leave: ClipboardList,
  Salary: IndianRupee,
  Expenses: ReceiptText,
  Team: Building2,
  Profile: UserRound,
  People: Users,
  Teams: Building2,
  Leaves: FileCheck,
  Policies: ShieldCheck,
  Payroll: WalletCards,
};

const getRole = user => String(user?.type || '').toLowerCase();

const EmployeeTabs = () => (
  <Tab.Navigator
    screenOptions={({route}) => ({
      headerStyle: {backgroundColor: colors.surface},
      headerTitleStyle: {color: colors.text, fontWeight: '900'},
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({color, size}) => {
        const Icon = icons[route.name];
        return <Icon color={color} size={size} />;
      },
    })}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Attendance" component={AttendanceScreen} />
    <Tab.Screen name="Leave" component={LeaveScreen} />
    <Tab.Screen name="Salary" component={SalaryScreen} />
    <Tab.Screen name="Expenses" component={ExpenseScreen} />
    <Tab.Screen name="Team" component={EmployeeTeamsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({route}) => ({
      headerStyle: {backgroundColor: colors.surface},
      headerTitleStyle: {color: colors.text, fontWeight: '900'},
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({color, size}) => {
        const Icon = icons[route.name];
        return <Icon color={color} size={size} />;
      },
    })}>
    <Tab.Screen name="Dashboard" component={AdminHomeScreen} />
    <Tab.Screen name="People" component={AdminPeopleScreen} />
    <Tab.Screen name="Teams" component={AdminTeamsScreen} />
    <Tab.Screen name="Leaves" component={AdminLeavesScreen} />
    <Tab.Screen name="Expenses" component={AdminExpensesScreen} />
    <Tab.Screen name="Payroll" component={AdminSalaryScreen} />
    <Tab.Screen name="Policies" component={AdminPoliciesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const dispatch = useDispatch();
  const {user, loading} = useSelector(state => state.auth);
  const isAdmin = getRole(user) === 'admin';

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {user ? (
          <Stack.Screen
            name={isAdmin ? 'Admin' : 'Employee'}
            component={isAdmin ? AdminTabs : EmployeeTabs}
          />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    borderTopColor: colors.border,
    height: 68,
    paddingBottom: 7,
    paddingTop: 5,
  },
});
