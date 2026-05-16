import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {BriefcaseBusiness, CalendarCheck, ClipboardList, IndianRupee, MapPin, ReceiptText, Users} from 'lucide-react-native';
import {getAttendance, getEmployeeExpenses, getLeaveApplications} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {MetricCard} from '../../components/MetricCard';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts} from '../../utils/date';

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
  });

  const today = useMemo(() => todayParts(), []);

  const loadSummary = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    try {
      const [attendanceResponse, expenseResponse, leaveResponse] = await Promise.all([
        getAttendance({employeeID: user.id, year: today.year, month: today.month}),
        getEmployeeExpenses(),
        getLeaveApplications({applicantID: user.id}),
      ]);
      const attendance = attendanceResponse?.data || [];
      const todayRecord = attendance.find(
        item => item.date === today.date && item.month === today.month && item.year === today.year,
      );
      const attendanceStatus = todayRecord?.attendanceOut
        ? 'Completed'
        : todayRecord?.attendanceIn
          ? 'Checked in'
          : 'Not checked in';
      setSummary({
        attendanceStatus,
        expenseCount: (expenseResponse?.data || expenseResponse?.expenses || []).length,
        leaveCount: (leaveResponse?.data || []).length,
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
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Target Management</Text>
        <Text style={styles.greeting}>Hi, {user?.name || user?.username}</Text>
        <Text style={styles.sub}>Dashboard</Text>
      </View>

      <View style={styles.grid}>
        <MetricCard icon={CalendarCheck} label="Today Attendance" value={summary.attendanceStatus} tone="success" />
        <MetricCard icon={ClipboardList} label="Leave Count" value={String(summary.leaveCount)} tone="primary" />
        <MetricCard icon={IndianRupee} label="Salary" value="View" tone="warning" />
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
