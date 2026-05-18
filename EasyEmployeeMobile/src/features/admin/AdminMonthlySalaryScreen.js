import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, RefreshControl, Share, StyleSheet, Text, View} from 'react-native';
import {Calculator, Download} from 'lucide-react-native';
import {
  calculateCurrentMonthSalaries,
  exportAdminMonthlySalaries,
  getAdminAllUsers,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';
import {todayParts} from '../../utils/date';

const idOf = item => String(item?.id || item?._id || '');
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());
const monthKey = item => `${item.year}-${String(item.month).padStart(2, '0')}`;

const parseJoiningDate = employee => {
  const parsed = new Date(employee?.date || employee?.joiningDate || employee?.createdAt || '');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const AdminMonthlySalaryScreen = ({navigation}) => {
  const [employees, setEmployees] = useState([]);
  const today = useMemo(() => todayParts(), []);
  const [payrollMonth, setPayrollMonth] = useState(String(today.month));
  const [payrollYear, setPayrollYear] = useState(String(today.year));
  const [payrollRows, setPayrollRows] = useState([]);
  const [payrollCycle, setPayrollCycle] = useState(null);
  const [selectedMonthlyEmployee, setSelectedMonthlyEmployee] = useState(null);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const employeeResponse = await getAdminAllUsers();
      setEmployees((employeeResponse?.data || []).filter(isWorkforce));
    } catch (err) {
      setToast(err.message || 'Employees could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const loadPayroll = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await calculateCurrentMonthSalaries({
        month: Number(payrollMonth) || today.month,
        year: Number(payrollYear) || today.year,
      });
      setPayrollRows(response?.data || []);
      setPayrollCycle(response?.cycle || null);
      setSelectedMonthDetail(null);
    } catch (err) {
      setToast(err.message || 'Monthly salaries could not be calculated.');
    } finally {
      setLoading(false);
    }
  };

  const exportPayroll = async () => {
    setLoading(true);
    try {
      const csv = await exportAdminMonthlySalaries({
        month: Number(payrollMonth) || today.month,
        year: Number(payrollYear) || today.year,
      });
      await Share.share({
        title: `monthly-salaries-${payrollMonth}-${payrollYear}.csv`,
        message: String(csv || ''),
      });
      setToast('Monthly salary CSV is ready to share.');
    } catch (err) {
      setToast(err.message || 'Salary export could not be prepared.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadPayroll();
  }, []);

  const visiblePayrollRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payrollRows;
    return payrollRows.filter(item =>
      `${item.name || ''} ${item.email || ''} ${item.username || ''} ${item.employeeCode || ''} ${item.employeeID || ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [payrollRows, search]);

  const monthOptions = useMemo(() => {
    if (!selectedMonthlyEmployee) return [];
    const current = new Date(today.year, today.month - 1, 1);
    const oneYearStart = new Date(current);
    oneYearStart.setMonth(current.getMonth() - 11);
    const joiningDate = parseJoiningDate(selectedMonthlyEmployee);
    const joiningMonth = joiningDate ? new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1) : oneYearStart;
    const start = joiningMonth > oneYearStart ? joiningMonth : oneYearStart;
    const months = [];
    for (let index = 0; index < 12; index += 1) {
      const date = new Date(current);
      date.setMonth(current.getMonth() - index);
      if (date < start) break;
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'}),
      });
    }
    return months;
  }, [selectedMonthlyEmployee, today]);

  const monthlyEmployeeRows = useMemo(() => {
    const payrollByEmployee = new Map(payrollRows.map(item => [String(item.employeeID), item]));
    return employees.map(employee => ({
      employee,
      payroll: payrollByEmployee.get(idOf(employee)),
    }));
  }, [employees, payrollRows]);

  const visibleMonthlyEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return monthlyEmployeeRows;
    return monthlyEmployeeRows.filter(({employee}) =>
      `${employee?.name || ''} ${employee?.email || ''} ${employee?.username || ''} ${employee?.employeeCode || ''} ${idOf(employee)}`
        .toLowerCase()
        .includes(term),
    );
  }, [monthlyEmployeeRows, search]);

  const openMonthDetail = async option => {
    if (!selectedMonthlyEmployee) return;
    setLoading(true);
    setToast('');
    try {
      const response = await calculateCurrentMonthSalaries({month: option.month, year: option.year});
      const detail = (response?.data || []).find(item => String(item.employeeID) === idOf(selectedMonthlyEmployee));
      setSelectedMonthDetail(detail ? {...detail, monthLabel: option.label, selectedMonthKey: monthKey(option), cycle: detail.cycle || response?.cycle} : null);
      if (!detail) setToast('Salary details not found for selected employee/month.');
    } catch (err) {
      setToast(err.message || 'Month salary details could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { load(); loadPayroll(); }} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />

      <Card>
        <Text style={styles.title}>Monthly Salaries</Text>
        <AppTextInput label="Search by name, email, employee ID, code, or letter" value={search} onChangeText={setSearch} />
        <View style={styles.twoCol}>
          <AppTextInput label="Month" keyboardType="numeric" value={payrollMonth} onChangeText={value => setPayrollMonth(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
          <AppTextInput label="Year" keyboardType="numeric" value={payrollYear} onChangeText={value => setPayrollYear(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
        </View>
        <View style={styles.actions}>
          <AppButton icon={Calculator} title="Calculate" loading={loading} onPress={loadPayroll} />
          <AppButton icon={Download} title="Export Past Month Salary" variant="muted" loading={loading} onPress={exportPayroll} />
        </View>
        {payrollCycle ? (
          <Text style={styles.count}>
            Today: {today.date}/{today.month}/{today.year} / Cycle: {payrollCycle.startDate} to {payrollCycle.endDate} / Master paid days: {payrollCycle.openDaysInMonth}
          </Text>
        ) : null}
        <Text style={styles.count}>{visiblePayrollRows.length} monthly salary records</Text>
      </Card>

      {!selectedMonthlyEmployee ? (
        <>
          <Card>
            <Text style={styles.title}>Employees and Leaders</Text>
            <Text style={styles.count}>Tap an employee to view month-wise salary.</Text>
          </Card>
          {visibleMonthlyEmployees.map(({employee, payroll}) => (
            <Pressable
              key={idOf(employee)}
              onPress={() => {
                setSelectedMonthlyEmployee(employee);
                setSelectedMonthDetail(null);
              }}>
              <Card>
                <View style={styles.headingRow}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{employee?.name || employee?.username || 'Employee'}</Text>
                    <Text style={styles.meta}>Email: {employee?.email || '-'}</Text>
                    <Text style={styles.meta}>Employee ID: {employee?.username || employee?.employeeCode || idOf(employee)}</Text>
                  </View>
                  <Text style={[styles.badge, payroll ? styles.assigned : styles.unassigned]}>
                    {payroll ? formatCurrency(payroll.totalPay || 0) : 'No salary'}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          <Card>
            <View style={styles.headingRow}>
              <View style={styles.flex}>
                <Text style={styles.title}>{selectedMonthlyEmployee.name || selectedMonthlyEmployee.username}</Text>
                <Text style={styles.meta}>Email: {selectedMonthlyEmployee.email || '-'}</Text>
                <Text style={styles.meta}>Employee ID: {selectedMonthlyEmployee.username || selectedMonthlyEmployee.employeeCode || idOf(selectedMonthlyEmployee)}</Text>
                <Text style={styles.meta}>Joining Date: {selectedMonthlyEmployee.date || '-'}</Text>
              </View>
              <AppButton title="Back" variant="muted" onPress={() => { setSelectedMonthlyEmployee(null); setSelectedMonthDetail(null); }} />
            </View>
          </Card>

          <Card>
            <Text style={styles.title}>Month List</Text>
            {monthOptions.map(option => (
              <Pressable
                key={`${option.month}-${option.year}`}
                onPress={() => openMonthDetail(option)}
                style={[
                  styles.monthRow,
                  selectedMonthDetail?.selectedMonthKey === monthKey(option) ? styles.selectedMonthRow : null,
                ]}>
                <Text style={[styles.name, selectedMonthDetail?.selectedMonthKey === monthKey(option) ? styles.selectedMonthText : null]}>
                  {option.label}
                </Text>
                <Text style={selectedMonthDetail?.selectedMonthKey === monthKey(option) ? styles.selectedMonthMeta : styles.meta}>
                  {option.month === today.month && option.year === today.year ? 'Current month' : 'Past month'}
                </Text>
              </Pressable>
            ))}
            {!monthOptions.length ? <Text style={styles.empty}>No month available from joining date.</Text> : null}
          </Card>

          {selectedMonthDetail ? (
            <Card>
              <Text style={styles.title}>{selectedMonthDetail.monthLabel || `${selectedMonthDetail.month}/${selectedMonthDetail.year}`} Salary Details</Text>
              <Text style={styles.net}>Total Pay: {formatCurrency(selectedMonthDetail.totalPay || 0)}</Text>
              <Text style={styles.meta}>Assigned monthly net salary: {formatCurrency(selectedMonthDetail.assignedNetPay || 0)}</Text>
              <Text style={styles.meta}>Assigned monthly gross salary: {formatCurrency(selectedMonthDetail.assignedGross || selectedMonthDetail.earnings?.gross || 0)}</Text>
              <Text style={styles.meta}>Per day salary: {formatCurrency(selectedMonthDetail.perDaySalary || 0)}</Text>
              <Text style={styles.meta}>Salary till date: {formatCurrency(selectedMonthDetail.salaryTillDate || 0)}</Text>
              <Text style={styles.meta}>Payable days: {selectedMonthDetail.payableDays} / Attendance days before weekly-off deduction: {selectedMonthDetail.attendancePayableDays ?? selectedMonthDetail.payableDays}</Text>
              <Text style={styles.meta}>Present: {selectedMonthDetail.presentDays} / Leave: {selectedMonthDetail.leaveDays} / Half days: {selectedMonthDetail.halfDays || 0}</Text>
              <Text style={styles.meta}>Weekly off days: {selectedMonthDetail.weeklyOffDays ?? selectedMonthDetail.sundayPaidDays ?? 0} / Weekly off salary impact: 0 day</Text>
              <Text style={styles.meta}>Holiday paid: {selectedMonthDetail.holidayPaidDays || 0} / Absent: {selectedMonthDetail.absentDays}</Text>
              <Text style={styles.meta}>Today: {today.date}/{today.month}/{today.year}</Text>
              <Text style={styles.meta}>Cycle: {selectedMonthDetail.cycle?.startDate} to {selectedMonthDetail.cycle?.endDate} / Master paid days: {selectedMonthDetail.cycle?.openDaysInMonth}</Text>
              <Text style={styles.meta}>Approved expenses: {formatCurrency(selectedMonthDetail.totalExpenses || 0)}</Text>
              <View style={styles.summary}>
                {[...(selectedMonthDetail.attendanceDetails || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))).map(day => (
                  <Text key={day.date} style={styles.summaryText}>
                    {day.date} {day.day}: {day.status} / {day.timeStatus} / {day.payableDays} day / {day.reason}
                  </Text>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      )}
      {!loading && !selectedMonthlyEmployee && !visibleMonthlyEmployees.length ? <Text style={styles.empty}>No employees found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.sm},
  section: {color: colors.primary, fontSize: 14, fontWeight: '900', marginTop: spacing.lg},
  headingRow: {alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between'},
  name: {color: colors.text, fontSize: 18, fontWeight: '900'},
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  count: {color: colors.textMuted, fontWeight: '800', marginTop: spacing.sm},
  monthRow: {borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: spacing.md},
  selectedMonthRow: {backgroundColor: colors.primary, borderRadius: 8, borderBottomWidth: 0, marginVertical: spacing.xs, paddingHorizontal: spacing.md},
  selectedMonthText: {color: colors.surface},
  selectedMonthMeta: {color: colors.surface, fontWeight: '800', marginTop: spacing.xs},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  badge: {borderRadius: 8, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs},
  assigned: {backgroundColor: colors.success, color: colors.surface},
  unassigned: {backgroundColor: colors.surfaceMuted, color: colors.textMuted},
  summary: {backgroundColor: colors.surfaceMuted, borderRadius: 8, gap: spacing.xs, marginVertical: spacing.md, padding: spacing.md},
  summaryText: {color: colors.textMuted, fontWeight: '800'},
  net: {color: colors.text, fontSize: 17, fontWeight: '900', marginTop: spacing.xs},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
