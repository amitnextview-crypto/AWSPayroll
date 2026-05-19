import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Calculator, X} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import {getMyMonthlySalaries} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts} from '../../utils/date';
import {formatCurrency} from '../../utils/money';

const userId = user => String(user?.username || user?.employeeCode || user?.id || user?._id || '');

const monthLabel = item =>
  new Date(Number(item.year), Number(item.month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

const cycleKey = item =>
  `${item.cycle?.startDate || item.year}-${item.cycle?.fullEndDate || item.cycle?.endDate || item.month}`;

const recentAttendance = item =>
  [...(item.attendanceDetails || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 7);

export const MyMonthlySalaryScreen = () => {
  const {user} = useSelector(state => state.auth);
  const today = useMemo(() => todayParts(), []);
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyMonthlySalaries();
      const seen = new Set();
      const nextRows = (response?.data || []).reduce((list, detail) => {
        const key = cycleKey(detail);
        if (seen.has(key)) return list;
        seen.add(key);
        list.push({
          ...detail,
          monthLabel: monthLabel(detail),
          amount: detail.totalPay ?? detail.salaryTillDate ?? 0,
        });
        return list;
      }, []);
      setRows(nextRows);
    } catch (err) {
      setRows([]);
      setError(err.message || 'Monthly salaries could not be loaded. Please check network and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRows = useMemo(() => {
    if (!activeFilter) return rows;
    return rows.filter(item => Number(item.month) === activeFilter.month && Number(item.year) === activeFilter.year);
  }, [activeFilter, rows]);

  const applySearch = () => {
    const month = Number(searchMonth);
    const year = Number(searchYear);
    if (!month || !year) {
      setActiveFilter(null);
      return;
    }
    setActiveFilter({month, year});
  };

  const clearSearch = () => {
    setSearchMonth('');
    setSearchYear('');
    setActiveFilter(null);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        eyebrow="Payroll cycle"
        title="My Monthly Salaries"
        subtitle="Month-wise payable salary calculated from attendance, leave, expenses, and salary rules."
      />
      <Card>
        <Text style={styles.title}>Search Salary Records</Text>
        <View style={styles.twoCol}>
          <AppTextInput
            keyboardType="numeric"
            label="Month"
            placeholder="1-12"
            value={searchMonth}
            onChangeText={value => setSearchMonth(value.replace(/[^0-9]/g, ''))}
            style={styles.flex}
          />
          <AppTextInput
            keyboardType="numeric"
            label="Year"
            placeholder={String(today.year)}
            value={searchYear}
            onChangeText={value => setSearchYear(value.replace(/[^0-9]/g, ''))}
            style={styles.flex}
          />
        </View>
        <View style={styles.actions}>
          <AppButton icon={Calculator} title="Search" loading={loading} onPress={applySearch} />
          <AppButton icon={X} title="Show All" variant="muted" disabled={loading} onPress={clearSearch} />
        </View>
        <Text style={styles.meta}>
          {activeFilter ? `${visibleRows.length} record for ${activeFilter.month}/${activeFilter.year}` : `${visibleRows.length} salary records from joining month`}
        </Text>
      </Card>

      {loading && !rows.length ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !visibleRows.length ? (
        <EmptyState title="No monthly salary" message="Salary records will appear after salary assignment and attendance calculation." />
      ) : null}

      {visibleRows.map(item => (
        <Card key={cycleKey(item)}>
          <View style={styles.rowHeader}>
            <View style={styles.flex}>
              <Text style={styles.month}>{item.monthLabel}</Text>
              <Text style={styles.name}>{item.name || user?.name || user?.username || '-'}</Text>
              <Text style={styles.meta}>Email: {item.email || user?.email || '-'}</Text>
              <Text style={styles.meta}>ID: {item.username || item.employeeCode || userId(user) || '-'}</Text>
              <Text style={styles.meta}>Cycle: {item.cycle?.startDate || '-'} to {item.cycle?.endDate || '-'}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>{item.salaryLabel || 'Amount'}</Text>
              <Text style={styles.amount}>{formatCurrency(item.amount || 0)}</Text>
            </View>
          </View>
          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceTitle}>Recent Attendance</Text>
            {recentAttendance(item).map(day => (
              <View key={`${cycleKey(item)}-${day.date}`} style={styles.attendanceRow}>
                <View style={styles.flex}>
                  <Text style={styles.attendanceDate}>{day.date}</Text>
                  <Text style={styles.meta}>{day.day || '-'} / {day.timeStatus || '-'}</Text>
                </View>
                <StatusPill value={day.status || '-'} />
                <Text style={styles.dayPay}>{day.payableDays || 0} day</Text>
              </View>
            ))}
            {!recentAttendance(item).length ? <Text style={styles.meta}>No attendance details in this cycle.</Text> : null}
          </View>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.sm},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  rowHeader: {alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between'},
  month: {color: colors.primary, fontSize: 13, fontWeight: '900', marginBottom: spacing.xs},
  name: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  amountBox: {alignItems: 'flex-end', backgroundColor: colors.surfaceMuted, borderRadius: 8, minWidth: 130, padding: spacing.md},
  amountLabel: {color: colors.textMuted, fontSize: 11, fontWeight: '900'},
  amount: {color: colors.success, fontSize: 18, fontWeight: '900', marginTop: spacing.xs},
  attendanceBox: {backgroundColor: colors.surfaceMuted, borderRadius: 8, gap: spacing.xs, marginTop: spacing.md, padding: spacing.md},
  attendanceTitle: {color: colors.text, fontSize: 14, fontWeight: '900'},
  attendanceRow: {alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm},
  attendanceDate: {color: colors.text, fontWeight: '900'},
  dayPay: {color: colors.primary, fontSize: 12, fontWeight: '900'},
  error: {color: colors.danger},
});
