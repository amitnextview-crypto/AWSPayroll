import React, {useEffect, useMemo, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Trash2} from 'lucide-react-native';
import {
  deleteAdminSalary,
  getAdminAllUsers,
  getAdminSalaries,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const idOf = item => String(item?.id || item?._id || '');
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());
const salaryEmployeeId = salary => {
  const employee = salary?.employeeID || salary?.employee || salary?.user;
  return typeof employee === 'object' ? idOf(employee) : String(employee || '');
};

export const AdminSalaryScreen = ({navigation}) => {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const [employeeResponse, salaryResponse] = await Promise.all([
        getAdminAllUsers(),
        getAdminSalaries({}),
      ]);
      setEmployees((employeeResponse?.data || []).filter(isWorkforce));
      setSalaries(salaryResponse?.data || salaryResponse?.salaries || []);
    } catch (err) {
      setToast(err.message || 'Salaries could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const salaryByEmployee = new Map(salaries.map(salary => [salaryEmployeeId(salary), salary]));
    const employeeRows = employees.map(employee => ({
      employee,
      salary: salaryByEmployee.get(idOf(employee)),
    }));
    const employeeIds = new Set(employeeRows.map(row => idOf(row.employee)));
    const orphanSalaryRows = salaries
      .filter(salary => !employeeIds.has(salaryEmployeeId(salary)))
      .map(salary => ({employee: salary.employeeID || salary.employee || salary.user || {}, salary}));
    return [...employeeRows, ...orphanSalaryRows];
  }, [employees, salaries]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(({employee, salary}) =>
      `${employee?.name || salary?.name || ''} ${employee?.email || ''} ${employee?.username || ''} ${employee?.employeeCode || ''} ${idOf(employee)} ${salaryEmployeeId(salary)}`
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const selectRow = row => {
    navigation.navigate('AdminAssignSalary', {employee: row.employee, salary: row.salary});
  };

  const confirmDelete = row => {
    const target = row;
    const salaryId = idOf(target?.salary);
    if (!salaryId) {
      setToast('No assigned salary found for this employee.');
      return;
    }
    Alert.alert('Delete salary', `Delete salary for ${target?.employee?.name || 'this employee'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteAdminSalary(salaryId);
            await load();
            setToast('Salary deleted successfully.');
          } catch (err) {
            setToast(err.message || 'Salary could not be deleted.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />

      <Card>
        <Text style={styles.title}>Employee Salaries</Text>
        <AppTextInput label="Search by name, email, employee ID, code, or letter" value={search} onChangeText={setSearch} />
        <Text style={styles.count}>{visibleRows.length} employees</Text>
      </Card>

      {visibleRows.map(({employee, salary}) => {
        const earnings = salary?.earnings || {};
        const deductions = salary?.deductions || {};
        return (
          <Card key={idOf(employee) || idOf(salary)}>
            <View style={styles.headingRow}>
              <View style={styles.flex}>
                <Text style={styles.name}>{employee?.name || employee?.username || 'Employee'}</Text>
                <Text style={styles.meta}>Employee ID: {employee?.username || idOf(employee) || '-'}</Text>
                <Text style={styles.meta}>Email: {employee?.email || '-'}</Text>
                <Text style={styles.meta}>Code: {employee?.employeeCode || '-'}</Text>
              </View>
              <Text style={[styles.badge, salary ? styles.assigned : styles.unassigned]}>
                {salary ? 'Assigned' : 'Not assigned'}
              </Text>
            </View>

            <View style={styles.details}>
              <Text style={styles.meta}>Basic: {formatCurrency(earnings.basic || 0)}</Text>
              <Text style={styles.meta}>HRA: {formatCurrency(earnings.hra || 0)}</Text>
              <Text style={styles.meta}>Conveyance: {formatCurrency(earnings.conveyance || 0)}</Text>
              <Text style={styles.meta}>Medical: {formatCurrency(earnings.medical || 0)}</Text>
              <Text style={styles.meta}>Special Allowance: {formatCurrency(earnings.specialAllowance || 0)}</Text>
              <Text style={styles.meta}>Bonus: {formatCurrency(earnings.bonus || 0)}</Text>
              <Text style={styles.meta}>Other Benefits: {formatCurrency(earnings.otherBenefits || 0)}</Text>
              <Text style={styles.meta}>Gross: {formatCurrency(earnings.gross || 0)}</Text>
              <Text style={styles.meta}>PF Employee: {formatCurrency(deductions.pfEmployee || 0)}</Text>
              <Text style={styles.meta}>PF Employer: {formatCurrency(deductions.pfEmployer || 0)}</Text>
              <Text style={styles.meta}>ESI Employee: {formatCurrency(deductions.esiEmployee || 0)}</Text>
              <Text style={styles.meta}>ESI Employer: {formatCurrency(deductions.esiEmployer || 0)}</Text>
              <Text style={styles.meta}>Professional Tax: {formatCurrency(deductions.professionalTax || 0)}</Text>
              <Text style={styles.meta}>Loan Recovery: {formatCurrency(deductions.loanRecovery || 0)}</Text>
              <Text style={styles.meta}>TDS Monthly: {formatCurrency(deductions.tdsMonthly || 0)}</Text>
              <Text style={styles.meta}>Total Deductions: {formatCurrency(deductions.totalDeductions || 0)}</Text>
              <Text style={styles.net}>Net Salary: {formatCurrency(salary?.netPay || 0)}</Text>
            </View>

            <View style={styles.actions}>
              <AppButton icon={Edit3} title={salary ? 'Edit Salary' : 'Assign Salary'} variant="muted" onPress={() => selectRow({employee, salary})} />
              {salary ? <AppButton icon={Trash2} title="Delete" variant="danger" onPress={() => confirmDelete({employee, salary})} /> : null}
            </View>
          </Card>
        );
      })}

      {!loading && !visibleRows.length ? <Text style={styles.empty}>No employees found.</Text> : null}
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
  details: {gap: spacing.xs, marginTop: spacing.md},
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
