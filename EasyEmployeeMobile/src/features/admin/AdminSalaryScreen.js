import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Plus, Trash2} from 'lucide-react-native';
import {
  deleteAdminSalary,
  getAdminAllUsers,
  getAdminSalaries,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const idOf = item => String(item?.id || item?._id || item || '');
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());
const salaryEmployeeId = salary => {
  const employee = salary?.employeeID || salary?.employee || salary?.user;
  return typeof employee === 'object' ? idOf(employee) : String(employee || '');
};

const structureRows = salary => {
  const earnings = salary?.earnings || {};
  const deductions = salary?.deductions || {};
  return [
    ['Basic', earnings.basic],
    ['HRA', earnings.hra],
    ['Conveyance', earnings.conveyance],
    ['Medical', earnings.medical],
    ['Special Allowance', earnings.specialAllowance],
    ['Bonus', earnings.bonus],
    ['Other Benefits', earnings.otherBenefits],
    ['Overtime Pay', earnings.overtimePay],
    ['Gross', earnings.gross],
    ['PF Employee', deductions.pfEmployee],
    ['ESI Employee', deductions.esiEmployee],
    ['Professional Tax', deductions.professionalTax],
    ['Loan Recovery', deductions.loanRecovery],
    ['TDS Monthly', deductions.tdsMonthly],
    ['Total Deductions', deductions.totalDeductions],
  ];
};

const statusItems = [
  {label: 'All', value: 'all'},
  {label: 'Assigned', value: 'assigned'},
  {label: 'Unassigned', value: 'unassigned'},
];

export const AdminSalaryScreen = ({navigation}) => {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('assigned');
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
      setToast(err.message || 'Salary structures could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const salaryByEmployee = useMemo(
    () => new Map(salaries.map(salary => [salaryEmployeeId(salary), salary])),
    [salaries],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees
      .map(employee => ({employee, salary: salaryByEmployee.get(idOf(employee))}))
      .filter(({employee, salary}) => {
        if (status === 'assigned' && !salary) return false;
        if (status === 'unassigned' && salary) return false;
        const haystack = `${employee.name || ''} ${employee.email || ''} ${employee.username || ''} ${employee.employeeCode || ''} ${idOf(employee)}`.toLowerCase();
        return !term || haystack.includes(term);
      });
  }, [employees, salaryByEmployee, search, status]);

  const removeSalary = async salary => {
    const id = salary?._id || salary?.id;
    if (!id) {
      setToast('Salary record id not found.');
      return;
    }
    setLoading(true);
    try {
      await deleteAdminSalary(id);
      setToast('Salary structure deleted successfully.');
      await load();
    } catch (err) {
      setToast(err.message || 'Salary structure could not be deleted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />
      <Card>
        <View style={styles.headingRow}>
          <View style={styles.flex}>
            <Text style={styles.title}>Assigned Salary Structures</Text>
            <Text style={styles.meta}>Employee/leader monthly structure only. Monthly payroll calculation is in Monthly Salaries.</Text>
          </View>
          <AppButton icon={Plus} title="Assign" onPress={() => navigation.navigate('AdminAssignSalary')} />
        </View>
        <AppTextInput label="Search by name, email, employee ID, or code" value={search} onChangeText={setSearch} />
        <FilterChips items={statusItems} value={status} onChange={setStatus} />
        <Text style={styles.count}>{rows.length} records</Text>
      </Card>

      {rows.map(({employee, salary}) => (
        <Card key={idOf(employee)}>
          <View style={styles.headingRow}>
            <View style={styles.flex}>
              <Text style={styles.name}>{employee.name || employee.username || 'Employee'}</Text>
              <Text style={styles.meta}>Email: {employee.email || '-'}</Text>
              <Text style={styles.meta}>Employee ID: {employee.username || employee.employeeCode || idOf(employee)}</Text>
              <Text style={styles.meta}>Role: {employee.type || '-'}</Text>
            </View>
            <Text style={[styles.badge, salary ? styles.assigned : styles.unassigned]}>
              {salary ? 'Assigned' : 'Unassigned'}
            </Text>
          </View>

          {salary ? (
            <>
              <Text style={styles.net}>Net Monthly Salary: {formatCurrency(salary.netPay || 0)}</Text>
              <View style={styles.summary}>
                {structureRows(salary).map(([label, value]) => (
                  <View key={label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(value || 0)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.actions}>
                <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => navigation.navigate('AdminAssignSalary', {employee, salary})} />
                <AppButton icon={Trash2} title="Delete" variant="danger" loading={loading} onPress={() => removeSalary(salary)} />
              </View>
            </>
          ) : (
            <View style={styles.actions}>
              <AppButton icon={Plus} title="Assign Salary" onPress={() => navigation.navigate('AdminAssignSalary', {employee})} />
            </View>
          )}
        </Card>
      ))}
      {!loading && !rows.length ? <Text style={styles.empty}>No salary structures found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.sm},
  headingRow: {alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between'},
  name: {color: colors.text, fontSize: 18, fontWeight: '900'},
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  count: {color: colors.textMuted, fontWeight: '800', marginTop: spacing.sm},
  flex: {flex: 1},
  badge: {borderRadius: 8, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs},
  assigned: {backgroundColor: colors.success, color: colors.surface},
  unassigned: {backgroundColor: colors.surfaceMuted, color: colors.textMuted},
  summary: {backgroundColor: colors.surfaceMuted, borderRadius: 8, gap: spacing.xs, marginVertical: spacing.md, padding: spacing.md},
  summaryRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md},
  summaryLabel: {color: colors.textMuted, flex: 1, fontWeight: '800'},
  summaryValue: {color: colors.text, fontWeight: '900'},
  net: {color: colors.text, fontSize: 17, fontWeight: '900', marginTop: spacing.md},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
