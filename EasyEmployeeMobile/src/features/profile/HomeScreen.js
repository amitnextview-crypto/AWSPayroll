import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {BriefcaseBusiness, CalendarCheck, ClipboardList, IndianRupee, MapPin, ReceiptText, Users} from 'lucide-react-native';
import {getAttendance, getEmployeeExpenses, getLeaveApplications, getMyMonthlySalaries} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {MetricCard} from '../../components/MetricCard';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts} from '../../utils/date';
import {formatCurrency} from '../../utils/money';

const Field = ({label, value}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '-'}</Text>
  </View>
);

export const HomeScreen = ({navigation}) => {
  const {user} = useSelector(state => state.auth);
  const [summary, setSummary] = useState({
    attendanceStatus: 'Loading',
    expenseCount: 0,
    leaveCount: 0,
    salaryTillDate: 0,
  });

  const today = useMemo(() => todayParts(), []);

  const loadSummary = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    try {
      const [attendanceResult, expenseResult, leaveResult, salaryResult] = await Promise.allSettled([
        getAttendance({employeeID: user.id, year: today.year, month: today.month, date: today.date}),
        getEmployeeExpenses(),
        getLeaveApplications({applicantID: user.id}),
        getMyMonthlySalaries(),
      ]);
      const attendanceResponse = attendanceResult.status === 'fulfilled' ? attendanceResult.value : {};
      const expenseResponse = expenseResult.status === 'fulfilled' ? expenseResult.value : {};
      const leaveResponse = leaveResult.status === 'fulfilled' ? leaveResult.value : {};
      const salaryResponse = salaryResult.status === 'fulfilled' ? salaryResult.value : {};
      const attendance = attendanceResponse?.data || [];
      const todayRecord = attendance.find(
        item => item.date === today.date && item.month === today.month && item.year === today.year,
      );
      const attendanceStatus = todayRecord?.attendanceOut
        ? 'Completed'
        : todayRecord?.attendanceIn
          ? 'Checked in'
          : 'Not checked in';
      const salaryRows = salaryResponse?.data || [];
      const salaryDetail =
        salaryRows.find(item => Number(item.month) === today.month && Number(item.year) === today.year) ||
        salaryRows[0] ||
        {};
      setSummary({
        attendanceStatus,
        expenseCount: (expenseResponse?.data || expenseResponse?.expenses || []).length,
        leaveCount: (leaveResponse?.data || []).length,
        salaryTillDate: salaryDetail.salaryTillDate ?? salaryDetail.totalPay ?? 0,
      });
    } catch (err) {
      setSummary(current => ({...current, attendanceStatus: 'Unavailable'}));
    }
  }, [today.date, today.month, today.year, user?.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <Screen>
      <PageHeader
        eyebrow="Employee workspace"
        title={`Hi, ${user?.name || user?.username}`}
        subtitle="Attendance, salary, leave, expenses, and profile data connected to payroll."
      />

      <View style={styles.grid}>
        <MetricCard icon={CalendarCheck} label="Today Attendance" value={summary.attendanceStatus} tone="success" />
        <MetricCard icon={ClipboardList} label="Leave Count" value={String(summary.leaveCount)} tone="primary" />
        <MetricCard icon={IndianRupee} label="Salary Till Date" value={formatCurrency(summary.salaryTillDate || 0)} tone="warning" />
        <MetricCard icon={ReceiptText} label="Expense Count" value={String(summary.expenseCount)} tone="info" />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Profile</Text>
        <Field label="Name" value={user?.name} />
        <Field label="Username" value={user?.username} />
        <Field label="Email" value={user?.email} />
        <Field label="Mobile" value={user?.mobile} />
        <Field label="Address" value={user?.address} />
        <Field label="User Type" value={user?.type} />
        <Field label="Status" value={user?.status} />
        <Field label="Designation" value={user?.designation} />
        <Field label="Work Type" value={user?.workType} />
        <Field label="UAN" value={user?.uan} />
        <Field label="ESI" value={user?.esi} />
        <Field label="PAN Number" value={user?.panNumber} />
        <Field label="Aadhaar Number" value={user?.aadhaarNumber} />
        <Field label="Bank Name" value={user?.bankName} />
        <Field label="Account Number" value={user?.accountNumber} />
        <Field label="IFSC Code" value={user?.ifscCode} />
        <Field label="Date" value={user?.date} />
      </Card>

      <View style={styles.quick}>
        {[
          ['Attendance', CalendarCheck, 'Attendance'],
          ['Team', Users, 'EmployeeTeam'],
          ['Leave', ClipboardList, 'Leave'],
          ['Salary', IndianRupee, 'Salary'],
          ['Expense', ReceiptText, 'EmployeeExpenses'],
          ['Work Type', BriefcaseBusiness, 'Profile'],
        ].map(([label, Icon, route]) => (
          <Pressable key={label} style={styles.quickItem} onPress={() => navigation.navigate(route)}>
            <Icon color={colors.primary} size={14} />
            <Text style={styles.quickText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <View style={styles.location}>
          <MapPin color={colors.info} size={19} />
          <Text style={styles.meta}>
            Onsite attendance uses live GPS verification. Time, date, leave, salary, and expense data come from the hosted backend.
          </Text>
        </View>
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
    marginTop: spacing.xs,
  },
  field: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldLabel: {
    color: colors.textMuted,
    flex: 0.9,
    fontSize: 12,
    fontWeight: '800',
  },
  fieldValue: {
    color: colors.text,
    flex: 1.1,
    fontSize: 13,
  },
  quick: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickText: {
    color: colors.text,
    fontWeight: '800',
  },
  location: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
