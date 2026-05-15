import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import {CalendarCheck, Home, IndianRupee, UserRound, ClipboardList} from 'lucide-react-native';
import {LoginScreen} from '../features/auth/LoginScreen';
import {AttendanceScreen} from '../features/attendance/AttendanceScreen';
import {LeaveScreen} from '../features/leave/LeaveScreen';
import {HomeScreen} from '../features/profile/HomeScreen';
import {ProfileScreen} from '../features/profile/ProfileScreen';
import {SalaryScreen} from '../features/salary/SalaryScreen';
import {restoreSession} from '../store/authSlice';
import {colors} from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Home: Home,
  Attendance: CalendarCheck,
  Leave: ClipboardList,
  Salary: IndianRupee,
  Profile: UserRound,
};

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
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const dispatch = useDispatch();
  const {user, loading} = useSelector(state => state.auth);

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
          <Stack.Screen name="Employee" component={EmployeeTabs} />
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
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
});
