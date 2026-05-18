import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  FileCheck,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react-native';
import {getAdminDashboard} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {MetricCard} from '../../components/MetricCard';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

export const AdminHomeScreen = ({navigation}) => {
  const {user} = useSelector(state => state.auth);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getAdminDashboard();
      setDashboard(response?.data || {});
    } catch (err) {
      setToast(err.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const payroll = dashboard?.payrollSummary || {};

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor={colors.primary} />
      }>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Admin Payroll Console</Text>
        <Text style={styles.greeting}>Hi, {user?.name || user?.username || 'Admin'}</Text>
        <Text style={styles.sub}>Live workforce, attendance, leave, and payroll overview</Text>
      </View>

      <ToastBanner message={toast} onHide={() => setToast('')} />
      {loading && !dashboard ? <ActivityIndicator color={colors.primary} size="large" /> : null}

      <View style={styles.grid}>
        <MetricCard icon={Users} label="Total Employees" value={dashboard?.totalEmployees || 0} tone="primary" />
        <MetricCard icon={CalendarCheck} label="Present Today" value={dashboard?.presentToday || 0} tone="success" />
        <MetricCard icon={BriefcaseBusiness} label="Absent Today" value={dashboard?.absentToday || 0} tone="warning" />
        <MetricCard icon={FileCheck} label="On Leave Today" value={dashboard?.onLeaveToday || 0} tone="info" />
        <MetricCard icon={Building2} label="Total Teams" value={dashboard?.totalTeams || 0} tone="success" />
        <MetricCard icon={ShieldCheck} label="Total Leaders" value={dashboard?.totalLeaders || 0} tone="info" />
        <MetricCard icon={Bell} label="Pending Leaves" value={dashboard?.pendingLeaveRequests || 0} tone="warning" />
        <MetricCard icon={IndianRupee} label="Payroll Net" value={formatCurrency(payroll.netPay || 0)} tone="primary" />
      </View>

      <Card>
        <Text style={styles.cardTitle}>This Month Payroll</Text>
        <View style={styles.payrollRow}>
          <Text style={styles.meta}>Employees covered</Text>
          <Text style={styles.value}>{payroll.employees || 0}</Text>
        </View>
        <View style={styles.payrollRow}>
          <Text style={styles.meta}>Gross salary</Text>
          <Text style={styles.value}>{formatCurrency(payroll.gross || 0)}</Text>
        </View>
        <View style={styles.payrollRow}>
          <Text style={styles.meta}>Deductions</Text>
          <Text style={styles.value}>{formatCurrency(payroll.deductions || 0)}</Text>
        </View>
        <View style={styles.payrollRow}>
          <Text style={styles.meta}>Payable till date</Text>
          <Text style={styles.value}>{formatCurrency(payroll.payableTillDate || 0)}</Text>
        </View>
        <Text style={styles.meta}>
          Cycle: {payroll.cycle?.startDate || '-'} to {payroll.cycle?.endDate || '-'} / Expenses included: {formatCurrency(payroll.approvedExpensesTillDate || 0)}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          {[
            ['Add User', UserPlus, 'AdminAddUser'],
            ['Employees', Users, 'AdminPeople'],
            ['Teams', Building2, 'AdminTeams'],
            ['Attendance', CalendarCheck, 'AdminAttendance'],
            ['Leaves', FileCheck, 'AdminLeaves'],
            ['Salaries', IndianRupee, 'AdminSalaries'],
            ['Monthly Salaries', IndianRupee, 'AdminMonthlySalaries'],
            ['Expenses', ReceiptText, 'AdminExpenses'],
            ['Policies', ShieldCheck, 'AdminPolicies'],
          ].map(([label, Icon, route]) => (
            <Pressable key={label} onPress={() => navigation.navigate(route)} style={styles.action}>
              <Icon color={colors.primary} size={18} />
              <Text style={styles.actionText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Notifications</Text>
        <ScrollView nestedScrollEnabled style={styles.limitedList}>
          {(dashboard?.notifications || []).map(item => (
            <Text key={item} style={styles.meta}>- {item}</Text>
          ))}
          {(dashboard?.pendingLeaveList || []).map(item => (
            <Pressable
              key={`leave-${item.id}`}
              onPress={() => navigation.navigate('AdminLeaves', {employeeID: item.employeeID, leaveID: item.id})}
              style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>Pending leave: {item.name || '-'}</Text>
              <Text style={styles.meta}>ID: {item.employeeID || '-'} / {item.type || '-'} / {item.startDate || '-'} to {item.endDate || '-'}</Text>
            </Pressable>
          ))}
          {(dashboard?.absentList || []).map(item => (
            <Pressable
              key={`absent-${item.id}`}
              onPress={() => navigation.navigate('AdminAttendance', {employeeID: item.employeeID, date: new Date().getDate()})}
              style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>Absent today: {item.name || '-'}</Text>
              <Text style={styles.meta}>ID: {item.username || item.employeeCode || item.employeeID || '-'}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Recent Activities</Text>
        <ScrollView nestedScrollEnabled style={styles.limitedList}>
          {(dashboard?.recentActivities || []).map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.activity}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.type} - {item.status || '-'}</Text>
            </View>
          ))}
        </ScrollView>
        {!dashboard?.recentActivities?.length ? <Text style={styles.meta}>No recent activity yet.</Text> : null}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.text,
    borderRadius: 8,
    padding: spacing.xl,
  },
  eyebrow: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  greeting: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '900',
  },
  sub: {
    color: '#dbeafe',
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  meta: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  value: {
    color: colors.text,
    fontWeight: '900',
  },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexBasis: '31%',
    flexGrow: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 72,
    padding: spacing.sm,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  activity: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  activityTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  notificationItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  notificationTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  limitedList: {
    maxHeight: 330,
  },
});
