import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Calculator} from 'lucide-react-native';
import {getMyMonthlySalary} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts} from '../../utils/date';
import {formatCurrency} from '../../utils/money';

export const MyMonthlySalaryScreen = () => {
  const today = useMemo(() => todayParts(), []);
  const [month, setMonth] = useState(String(today.month));
  const [year, setYear] = useState(String(today.year));
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyMonthlySalary({
        month: Number(month) || today.month,
        year: Number(year) || today.year,
      });
      setDetail(response?.data || null);
    } catch (err) {
      setDetail(null);
      setError(err.message || 'Monthly salary could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [month, today.month, today.year, year]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card>
        <Text style={styles.title}>My Monthly Salary</Text>
        <View style={styles.twoCol}>
          <AppTextInput label="Month" keyboardType="numeric" value={month} onChangeText={value => setMonth(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
          <AppTextInput label="Year" keyboardType="numeric" value={year} onChangeText={value => setYear(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
        </View>
        <View style={styles.actions}>
          <AppButton icon={Calculator} title="Calculate" loading={loading} onPress={load} />
        </View>
      </Card>

      {loading && !detail ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {detail ? (
        <Card>
          <Text style={styles.title}>{detail.month}/{detail.year} Salary</Text>
          <Text style={styles.net}>Total Pay Till Date: {formatCurrency(detail.totalPay || 0)}</Text>
          <Text style={styles.meta}>Assigned net salary: {formatCurrency(detail.assignedNetPay || 0)}</Text>
          <Text style={styles.meta}>Assigned gross salary: {formatCurrency(detail.assignedGross || detail.earnings?.gross || 0)}</Text>
          <Text style={styles.meta}>Per day salary: {formatCurrency(detail.perDaySalary || 0)}</Text>
          <Text style={styles.meta}>Salary till date: {formatCurrency(detail.salaryTillDate || 0)}</Text>
          <Text style={styles.meta}>Approved expenses: {formatCurrency(detail.totalExpenses || 0)}</Text>
          <Text style={styles.meta}>Cycle: {detail.cycle?.startDate || '-'} to {detail.cycle?.endDate || '-'}</Text>
          <Text style={styles.meta}>Fixed paid days: {detail.cycle?.openDaysInMonth || '-'}</Text>
          <Text style={styles.meta}>Payable days: {detail.payableDays} / Present: {detail.presentDays} / Half day: {detail.halfDays || 0}</Text>
          <Text style={styles.meta}>Approved leave: {detail.leaveDays} / Paid holiday: {detail.holidayPaidDays || 0} / Weekly off: {detail.weeklyOffDays || 0}</Text>
          <View style={styles.summary}>
            {[...(detail.attendanceDetails || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))).map(day => (
              <Text key={day.date} style={styles.summaryText}>
                {day.date} {day.day}: {day.status} / {day.timeStatus} / {day.payableDays} day / {day.reason}
              </Text>
            ))}
          </View>
        </Card>
      ) : !loading ? (
        <EmptyState title="No monthly salary" message="Your monthly salary calculation will appear after salary assignment and attendance records." />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.sm},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  net: {color: colors.success, fontSize: 20, fontWeight: '900', marginTop: spacing.sm},
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  summary: {backgroundColor: colors.surfaceMuted, borderRadius: 8, gap: spacing.xs, marginVertical: spacing.md, padding: spacing.md},
  summaryText: {color: colors.textMuted, fontWeight: '800'},
  error: {color: colors.danger},
});
