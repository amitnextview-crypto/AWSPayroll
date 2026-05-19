import React, {useEffect, useMemo, useState} from 'react';
import {Alert, NativeModules, Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Calculator, FileSpreadsheet, FileText} from 'lucide-react-native';
import {
  calculateCurrentMonthSalaries,
  exportAdminMonthlySalaries,
  getAdminAllUsers,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';
import {todayParts} from '../../utils/date';

const idOf = item => String(item?.id || item?._id || '');
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());
const monthKey = item => `${item.year}-${String(item.month).padStart(2, '0')}`;
const {SalaryFileModule} = NativeModules;

const toBase64 = data => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const encode = binary => {
    let output = '';
    for (let index = 0; index < binary.length; index += 3) {
      const chr1 = binary.charCodeAt(index);
      const chr2 = binary.charCodeAt(index + 1);
      const chr3 = binary.charCodeAt(index + 2);
      const enc1 = chr1 >> 2;
      const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      const enc3 = Number.isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
      const enc4 = Number.isNaN(chr3) ? 64 : chr3 & 63;
      output += alphabet.charAt(enc1) + alphabet.charAt(enc2) + alphabet.charAt(enc3) + alphabet.charAt(enc4);
    }
    return output;
  };
  if (typeof data === 'string') {
    return global.btoa ? global.btoa(data) : encode(data);
  }
  const bytes = new Uint8Array(data);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return global.btoa ? global.btoa(binary) : encode(binary);
};

const parseJoiningDate = employee => {
  const parsed = new Date(employee?.date || employee?.joiningDate || employee?.createdAt || '');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const SummaryTile = ({label, value, tone}) => (
  <View style={[styles.summaryTile, tone === 'success' ? styles.summaryTileSuccess : null]}>
    <Text style={[styles.summaryLabel, tone === 'success' ? styles.summaryLabelSuccess : null]}>{label}</Text>
    <Text style={[styles.summaryValue, tone === 'success' ? styles.summaryValueSuccess : null]}>{value}</Text>
  </View>
);

const DetailLine = ({label, value}) => (
  <View style={styles.detailLine}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
      if (response?.cycle?.fullEndDate || response?.cycle?.endDate) {
        const [, resolvedMonth] = String(response.cycle.fullEndDate || response.cycle.endDate).split('-');
        const [resolvedYear] = String(response.cycle.fullEndDate || response.cycle.endDate).split('-');
        if (resolvedMonth && resolvedYear) {
          setPayrollMonth(String(Number(resolvedMonth)));
          setPayrollYear(String(Number(resolvedYear)));
        }
      }
      setSelectedMonthDetail(null);
    } catch (err) {
      setToast(err.message || 'Monthly salaries could not be calculated.');
    } finally {
      setLoading(false);
    }
  };

  const exportPayroll = async (format = 'xlsx') => {
    setLoading(true);
    try {
      const isPdf = format === 'pdf';
      const file = await exportAdminMonthlySalaries({
        pastCycle: true,
        format,
      });
      const base64 = toBase64(file);
      if (!SalaryFileModule?.saveBase64File) {
        throw new Error('Download service is not available. Please rebuild the app.');
      }
      const extension = isPdf ? 'pdf' : 'xlsx';
      const mimeType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const fileName = `bank-salary-upload-${Date.now()}.${extension}`;
      const uri = await SalaryFileModule.saveBase64File(fileName, mimeType, base64);
      setToast(`Past cycle bank salary ${extension.toUpperCase()} downloaded.`);
      Alert.alert('Salary export downloaded', `${fileName} saved in Downloads/AWSPayroll.\n${uri || ''}`);
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

      <PageHeader
        eyebrow="Payroll command"
        title="Monthly Salaries"
        subtitle="Cycle-aware salary, deductions, bank details, and export control for HR."
      />

      <Card>
        <Text style={styles.title}>Salary Cycle Controls</Text>
        <AppTextInput label="Search by name, email, employee ID, code, or letter" value={search} onChangeText={setSearch} />
        <View style={styles.twoCol}>
          <AppTextInput label="Month" keyboardType="numeric" value={payrollMonth} onChangeText={value => setPayrollMonth(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
          <AppTextInput label="Year" keyboardType="numeric" value={payrollYear} onChangeText={value => setPayrollYear(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
        </View>
        <View style={styles.actions}>
          <AppButton icon={Calculator} title="Search Salaries" loading={loading} onPress={loadPayroll} />
          <AppButton icon={FileSpreadsheet} title="Download XLSX" variant="muted" loading={loading} onPress={() => exportPayroll('xlsx')} />
          <AppButton icon={FileText} title="Download PDF" variant="muted" loading={loading} onPress={() => exportPayroll('pdf')} />
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
            <Text style={styles.count}>Tap an employee to view concise month-wise salary details.</Text>
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
                    <Text style={styles.meta}>Bank: {employee?.bankName || '-'} / IFSC: {employee?.ifscCode || '-'}</Text>
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
              <View style={styles.summaryGrid}>
                <SummaryTile label={selectedMonthDetail.salaryLabel || 'Salary Till Date'} value={formatCurrency(selectedMonthDetail.totalPay || 0)} tone="success" />
                <SummaryTile label="Net Salary" value={formatCurrency(selectedMonthDetail.assignedNetPay || 0)} />
                <SummaryTile label="Per Day" value={formatCurrency(selectedMonthDetail.perDaySalary || 0)} />
                <SummaryTile label="Payable Days" value={String(selectedMonthDetail.payableDays || 0)} />
              </View>
              <View style={styles.detailBox}>
                <DetailLine label="Cycle" value={`${selectedMonthDetail.cycle?.startDate || '-'} to ${selectedMonthDetail.cycle?.endDate || '-'}`} />
                <DetailLine label="Fixed paid days" value={String(selectedMonthDetail.cycle?.openDaysInMonth || '-')} />
                <DetailLine label="Present / Leave / Half" value={`${selectedMonthDetail.presentDays || 0} / ${selectedMonthDetail.leaveDays || 0} / ${selectedMonthDetail.halfDays || 0}`} />
                <DetailLine label="Holiday / Absent" value={`${selectedMonthDetail.holidayPaidDays || 0} / ${selectedMonthDetail.absentDays || 0}`} />
                <DetailLine label="Approved expenses" value={formatCurrency(selectedMonthDetail.totalExpenses || 0)} />
                <DetailLine label="Gross / Net" value={`${formatCurrency(selectedMonthDetail.assignedGross || 0)} / ${formatCurrency(selectedMonthDetail.assignedNetPay || 0)}`} />
                <DetailLine label="Deductions" value={formatCurrency(selectedMonthDetail.deductions?.totalDeductions || 0)} />
                <DetailLine label="Bank" value={`${selectedMonthlyEmployee.bankName || '-'} / ${selectedMonthlyEmployee.accountNumber || '-'} / ${selectedMonthlyEmployee.ifscCode || '-'}`} />
              </View>
              <View style={styles.summary}>
                <Text style={styles.section}>Cycle Attendance</Text>
                {[...(selectedMonthDetail.attendanceDetails || [])].sort((a, b) => String(a.date).localeCompare(String(b.date))).map(day => (
                  <View key={day.date} style={styles.dayRow}>
                    <Text style={styles.dayDate}>{day.date}</Text>
                    <Text style={styles.dayStatus}>{day.status}</Text>
                    <Text style={styles.dayPay}>{day.payableDays} day</Text>
                  </View>
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
  summaryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm},
  summaryTile: {backgroundColor: colors.surfaceMuted, borderRadius: 8, flexBasis: '47%', flexGrow: 1, padding: spacing.md},
  summaryTileSuccess: {backgroundColor: colors.success},
  summaryLabel: {color: colors.textMuted, fontSize: 12, fontWeight: '900'},
  summaryLabelSuccess: {color: colors.surface},
  summaryValue: {color: colors.text, fontSize: 16, fontWeight: '900', marginTop: spacing.xs},
  summaryValueSuccess: {color: colors.surface},
  detailBox: {borderColor: colors.border, borderRadius: 8, borderWidth: 1, marginTop: spacing.md, padding: spacing.md},
  detailLine: {borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm},
  detailLabel: {color: colors.textMuted, flex: 1, fontWeight: '800'},
  detailValue: {color: colors.text, flex: 1.2, fontWeight: '900', textAlign: 'right'},
  dayRow: {alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm},
  dayDate: {color: colors.text, flex: 1, fontWeight: '900'},
  dayStatus: {color: colors.textMuted, flex: 1, fontWeight: '800'},
  dayPay: {color: colors.primary, fontWeight: '900'},
  net: {color: colors.text, fontSize: 17, fontWeight: '900', marginTop: spacing.xs},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
