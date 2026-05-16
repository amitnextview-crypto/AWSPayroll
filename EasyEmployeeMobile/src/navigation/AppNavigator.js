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
  Home,
  LayoutDashboard,
  Menu,
  UserRound,
} from 'lucide-react-native';
import {LoginScreen} from '../features/auth/LoginScreen';
import {ForgotPasswordScreen} from '../features/auth/ForgotPasswordScreen';
import {AdminAddTeamScreen} from '../features/admin/AdminAddTeamScreen';
import {AdminAddUserScreen} from '../features/admin/AdminAddUserScreen';
import {AdminAssignSalaryScreen} from '../features/admin/AdminAssignSalaryScreen';
import {AdminAttendanceScreen} from '../features/admin/AdminAttendanceScreen';
import {AdminHomeScreen} from '../features/admin/AdminHomeScreen';
import {AdminExpensesScreen} from '../features/admin/AdminExpensesScreen';
import {AdminLeavesScreen} from '../features/admin/AdminLeavesScreen';
import {AdminMenuScreen} from '../features/admin/AdminMenuScreen';
import {AdminPeopleScreen} from '../features/admin/AdminPeopleScreen';
import {AdminPoliciesScreen} from '../features/admin/AdminPoliciesScreen';
import {AdminSalaryScreen} from '../features/admin/AdminSalaryScreen';
import {AdminSettingsScreen} from '../features/admin/AdminSettingsScreen';
import {AdminTeamsScreen} from '../features/admin/AdminTeamsScreen';
import {AdminTdsRulesScreen} from '../features/admin/AdminTdsRulesScreen';
import {AttendanceScreen} from '../features/attendance/AttendanceScreen';
import {InfoScreen} from '../features/common/InfoScreen';
import {ExpenseScreen} from '../features/expenses/ExpenseScreen';
import {LeaveScreen} from '../features/leave/LeaveScreen';
import {EmployeeMenuScreen} from '../features/profile/EmployeeMenuScreen';
import {HomeScreen} from '../features/profile/HomeScreen';
import {ProfileScreen} from '../features/profile/ProfileScreen';
import {SalaryScreen} from '../features/salary/SalaryScreen';
import {EmployeeTeamsScreen} from '../features/teams/EmployeeTeamsScreen';
import {restoreSession} from '../store/authSlice';
import {getThemeColors} from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EmployeeStackNavigator = createNativeStackNavigator();
const AdminStackNavigator = createNativeStackNavigator();

const icons = {
  Dashboard: LayoutDashboard,
  Home: Home,
  Attendance: CalendarCheck,
  Menu: Menu,
  Team: Building2,
  Profile: UserRound,
};

const getRole = user => String(user?.type || '').toLowerCase();

const EmployeeTabs = () => (
  <ThemedTabs>
    <Tab.Screen name="Home" component={HomeScreen} options={{title: 'Dashboard'}} />
    <Tab.Screen name="Attendance" component={AttendanceScreen} />
    <Tab.Screen name="Menu" component={EmployeeMenuScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </ThemedTabs>
);

const AdminTabs = () => (
  <ThemedTabs>
    <Tab.Screen name="Dashboard" component={AdminHomeScreen} />
    <Tab.Screen name="Menu" component={AdminMenuScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </ThemedTabs>
);

const ThemedTabs = ({children}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerStyle: {backgroundColor: colors.surface},
        headerTitleStyle: {color: colors.text, fontWeight: '900'},
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, {backgroundColor: colors.surface, borderTopColor: colors.border}],
        tabBarIcon: ({color, size}) => {
          const Icon = icons[route.name];
          return <Icon color={color} size={size} />;
        },
      })}>
      {children}
    </Tab.Navigator>
  );
};

const EmployeeStack = () => (
  <ThemedStack Navigator={EmployeeStackNavigator}>
    <EmployeeStackNavigator.Screen name="EmployeeTabs" component={EmployeeTabs} options={{headerShown: false}} />
    <EmployeeStackNavigator.Screen name="Home" component={HomeScreen} options={{title: 'Dashboard'}} />
    <EmployeeStackNavigator.Screen name="Attendance" component={AttendanceScreen} />
    <EmployeeStackNavigator.Screen name="Leave" component={LeaveScreen} options={{title: 'Leave Applications'}} />
    <EmployeeStackNavigator.Screen name="Salary" component={SalaryScreen} />
    <EmployeeStackNavigator.Screen name="EmployeeExpenses" component={ExpenseScreen} options={{title: 'Submit Expense'}} />
    <EmployeeStackNavigator.Screen name="EmployeeTeam" component={EmployeeTeamsScreen} options={{title: 'Team'}} />
    <EmployeeStackNavigator.Screen name="Info" component={InfoScreen} />
  </ThemedStack>
);

const AdminStack = () => (
  <ThemedStack Navigator={AdminStackNavigator}>
    <AdminStackNavigator.Screen name="AdminTabs" component={AdminTabs} options={{headerShown: false}} />
    <AdminStackNavigator.Screen name="Dashboard" component={AdminHomeScreen} />
    <AdminStackNavigator.Screen name="AdminPeople" component={AdminPeopleScreen} options={{title: 'Employees'}} />
    <AdminStackNavigator.Screen name="AdminTeams" component={AdminTeamsScreen} options={{title: 'Teams'}} />
    <AdminStackNavigator.Screen name="AdminAttendance" component={AdminAttendanceScreen} options={{title: 'Attendance'}} />
    <AdminStackNavigator.Screen name="AdminLeaves" component={AdminLeavesScreen} options={{title: 'Leaves'}} />
    <AdminStackNavigator.Screen name="AdminExpenses" component={AdminExpensesScreen} options={{title: 'Expenses'}} />
    <AdminStackNavigator.Screen name="AdminAssignSalary" component={AdminAssignSalaryScreen} options={{title: 'Assign Salary'}} />
    <AdminStackNavigator.Screen name="AdminTdsRules" component={AdminTdsRulesScreen} options={{title: 'TDS Rules'}} />
    <AdminStackNavigator.Screen name="AdminSalaries" component={AdminSalaryScreen} options={{title: 'Salaries'}} />
    <AdminStackNavigator.Screen name="AdminPolicies" component={AdminPoliciesScreen} options={{title: 'Payroll Policies'}} />
    <AdminStackNavigator.Screen name="AdminSettings" component={AdminSettingsScreen} options={{title: 'Settings'}} />
    <AdminStackNavigator.Screen name="AdminAddUser" component={AdminAddUserScreen} options={{title: 'Add Employee'}} />
    <AdminStackNavigator.Screen name="AdminAddTeam" component={AdminAddTeamScreen} options={{title: 'Add Team'}} />
    <AdminStackNavigator.Screen name="Info" component={InfoScreen} />
  </ThemedStack>
);

const ThemedStack = ({Navigator, children}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  return (
    <Navigator.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.surface},
        headerTitleStyle: {color: colors.text, fontWeight: '900'},
        headerTintColor: colors.text,
        contentStyle: {backgroundColor: colors.background},
      }}>
      {children}
    </Navigator.Navigator>
  );
};

export const AppNavigator = () => {
  const dispatch = useDispatch();
  const {user, loading} = useSelector(state => state.auth);
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  const isAdmin = getRole(user) === 'admin';

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={[styles.loader, {backgroundColor: colors.background}]}>
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
            component={isAdmin ? AdminStack : EmployeeStack}
          />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    height: 68,
    paddingBottom: 7,
    paddingTop: 5,
  },
});
