import React, {useEffect, useMemo, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Plus, Save, Trash2, X} from 'lucide-react-native';
import {
  assignAdminSalary,
  deleteAdminSalary,
  getAdminEmployees,
  getAdminSalaries,
  updateAdminSalary,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const emptyForm = {
  basic: '',
  hra: '',
  conveyance: '',
  medical: '',
  specialAllowance: '',
  bonus: '',
  overtimeHours: '',
  overtimeRate: '',
  otherBenefits: '',
  pfEmployeePercent: '12',
  pfEmployerPercent: '12',
  esiEmployeePercent: '0',
  esiEmployerPercent: '0',
  professionalTax: '0',
  loanRecovery: '0',
  tdsMonthly: '0',
};

const numeric = value => Number(value || 0);
const idOf = item => String(item?.id || item?._id || '');
const salaryEmployeeId = salary => {
  const employee = salary?.employeeID || salary?.employee || salary?.user;
  return typeof employee === 'object' ? idOf(employee) : String(employee || '');
};

const toForm = salary => {
  const earnings = salary?.earnings || {};
  const deductions = salary?.deductions || {};
  return {
    basic: String(earnings.basic ?? ''),
    hra: String(earnings.hra ?? ''),
    conveyance: String(earnings.conveyance ?? ''),
    medical: String(earnings.medical ?? ''),
    specialAllowance: String(earnings.specialAllowance ?? ''),
    bonus: String(earnings.bonus ?? ''),
    overtimeHours: String(earnings.overtimeHours ?? ''),
    overtimeRate: String(earnings.overtimeRate ?? ''),
    otherBenefits: String(earnings.otherBenefits ?? ''),
    pfEmployeePercent: String(deductions.pfEmployeePercent ?? '12'),
    pfEmployerPercent: String(deductions.pfEmployerPercent ?? '12'),
    esiEmployeePercent: String(deductions.esiEmployeePercent ?? '0'),
    esiEmployerPercent: String(deductions.esiEmployerPercent ?? '0'),
    professionalTax: String(deductions.professionalTax ?? '0'),
    loanRecovery: String(deductions.loanRecovery ?? '0'),
    tdsMonthly: String(deductions.tdsMonthly ?? '0'),
  };
};

export const AdminSalaryScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const [employeeResponse, salaryResponse] = await Promise.all([
        getAdminEmployees({limit: 100}),
        getAdminSalaries({}),
      ]);
      setEmployees(employeeResponse?.data || []);
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

  const totals = useMemo(() => {
    const overtimePay = numeric(form.overtimeHours) * numeric(form.overtimeRate);
    const gross =
      numeric(form.basic) +
      numeric(form.hra) +
      numeric(form.conveyance) +
      numeric(form.medical) +
      numeric(form.specialAllowance) +
      numeric(form.bonus) +
      numeric(form.otherBenefits) +
      overtimePay;
    const pfEmployee = Math.min((numeric(form.basic) * numeric(form.pfEmployeePercent)) / 100, 1800);
    const pfEmployer = Math.min((numeric(form.basic) * numeric(form.pfEmployerPercent)) / 100, 1800);
    const esiEmployee = (gross * numeric(form.esiEmployeePercent)) / 100;
    const esiEmployer = (gross * numeric(form.esiEmployerPercent)) / 100;
    const deductions = pfEmployee + esiEmployee + numeric(form.professionalTax) + numeric(form.loanRecovery) + numeric(form.tdsMonthly);
    return {overtimePay, gross, pfEmployee, pfEmployer, esiEmployee, esiEmployer, deductions, net: Math.max(gross - deductions, 0)};
  }, [form]);

  const selectRow = row => {
    setSelected(row);
    setForm(row.salary ? toForm(row.salary) : emptyForm);
  };

  const set = (key, value) => setForm(current => ({...current, [key]: value.replace(/[^0-9.]/g, '')}));

  const buildPayload = () => ({
    employeeID: idOf(selected?.employee) || salaryEmployeeId(selected?.salary),
    earnings: {
      basic: numeric(form.basic),
      hra: numeric(form.hra),
      conveyance: numeric(form.conveyance),
      medical: numeric(form.medical),
      specialAllowance: numeric(form.specialAllowance),
      bonus: numeric(form.bonus),
      overtimeHours: numeric(form.overtimeHours),
      overtimeRate: numeric(form.overtimeRate),
      overtimePay: totals.overtimePay,
      otherBenefits: numeric(form.otherBenefits),
      gross: totals.gross,
    },
    deductions: {
      pfEmployeePercent: numeric(form.pfEmployeePercent),
      pfEmployee: totals.pfEmployee,
      pfEmployerPercent: numeric(form.pfEmployerPercent),
      pfEmployer: totals.pfEmployer,
      esiEmployeePercent: numeric(form.esiEmployeePercent),
      esiEmployee: totals.esiEmployee,
      esiEmployerPercent: numeric(form.esiEmployerPercent),
      esiEmployer: totals.esiEmployer,
      professionalTax: numeric(form.professionalTax),
      loanRecovery: numeric(form.loanRecovery),
      tdsMonthly: numeric(form.tdsMonthly),
      totalDeductions: totals.deductions,
    },
    netPay: totals.net,
  });

  const save = async () => {
    if (!selected) {
      setToast('Select employee first.');
      return;
    }
    if (!numeric(form.basic)) {
      setToast('Basic salary is required.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      if (selected.salary) await updateAdminSalary(payload);
      else await assignAdminSalary(payload);
      const message = selected.salary ? 'Salary updated successfully.' : 'Salary assigned successfully.';
      setSelected(null);
      setForm(emptyForm);
      await load();
      setToast(message);
    } catch (err) {
      setToast(err.message || 'Salary could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = row => {
    const target = row || selected;
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
            if (!row || salaryId === idOf(selected?.salary)) {
              setSelected(null);
              setForm(emptyForm);
            }
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

      {selected ? (
        <Card>
          <View style={styles.headingRow}>
            <View style={styles.flex}>
              <Text style={styles.title}>{selected.salary ? 'Edit Salary' : 'Assign Salary'}</Text>
              <Text style={styles.meta}>{selected.employee?.name || selected.employee?.username || '-'}</Text>
              <Text style={styles.meta}>{selected.employee?.email || '-'}</Text>
            </View>
            <AppButton icon={X} title="Close" variant="muted" onPress={() => { setSelected(null); setForm(emptyForm); }} />
          </View>

          <Text style={styles.section}>Earnings</Text>
          <View style={styles.twoCol}>
            <AppTextInput label="Basic" keyboardType="numeric" value={form.basic} onChangeText={value => set('basic', value)} style={styles.flex} />
            <AppTextInput label="HRA" keyboardType="numeric" value={form.hra} onChangeText={value => set('hra', value)} style={styles.flex} />
          </View>
          <View style={styles.twoCol}>
            <AppTextInput label="Conveyance" keyboardType="numeric" value={form.conveyance} onChangeText={value => set('conveyance', value)} style={styles.flex} />
            <AppTextInput label="Medical" keyboardType="numeric" value={form.medical} onChangeText={value => set('medical', value)} style={styles.flex} />
          </View>
          <AppTextInput label="Special Allowance" keyboardType="numeric" value={form.specialAllowance} onChangeText={value => set('specialAllowance', value)} />
          <View style={styles.twoCol}>
            <AppTextInput label="Bonus" keyboardType="numeric" value={form.bonus} onChangeText={value => set('bonus', value)} style={styles.flex} />
            <AppTextInput label="Other Benefits" keyboardType="numeric" value={form.otherBenefits} onChangeText={value => set('otherBenefits', value)} style={styles.flex} />
          </View>
          <View style={styles.twoCol}>
            <AppTextInput label="Overtime Hours" keyboardType="numeric" value={form.overtimeHours} onChangeText={value => set('overtimeHours', value)} style={styles.flex} />
            <AppTextInput label="Overtime Rate" keyboardType="numeric" value={form.overtimeRate} onChangeText={value => set('overtimeRate', value)} style={styles.flex} />
          </View>

          <Text style={styles.section}>Deductions</Text>
          <View style={styles.twoCol}>
            <AppTextInput label="PF Employee %" keyboardType="numeric" value={form.pfEmployeePercent} onChangeText={value => set('pfEmployeePercent', value)} style={styles.flex} />
            <AppTextInput label="PF Employer %" keyboardType="numeric" value={form.pfEmployerPercent} onChangeText={value => set('pfEmployerPercent', value)} style={styles.flex} />
          </View>
          <View style={styles.twoCol}>
            <AppTextInput label="ESI Employee %" keyboardType="numeric" value={form.esiEmployeePercent} onChangeText={value => set('esiEmployeePercent', value)} style={styles.flex} />
            <AppTextInput label="ESI Employer %" keyboardType="numeric" value={form.esiEmployerPercent} onChangeText={value => set('esiEmployerPercent', value)} style={styles.flex} />
          </View>
          <View style={styles.twoCol}>
            <AppTextInput label="Professional Tax" keyboardType="numeric" value={form.professionalTax} onChangeText={value => set('professionalTax', value)} style={styles.flex} />
            <AppTextInput label="Loan Recovery" keyboardType="numeric" value={form.loanRecovery} onChangeText={value => set('loanRecovery', value)} style={styles.flex} />
          </View>
          <AppTextInput label="TDS Monthly" keyboardType="numeric" value={form.tdsMonthly} onChangeText={value => set('tdsMonthly', value)} />

          <View style={styles.summary}>
            <Text style={styles.summaryText}>Gross: {formatCurrency(totals.gross)}</Text>
            <Text style={styles.summaryText}>PF Employee: {formatCurrency(totals.pfEmployee)}</Text>
            <Text style={styles.summaryText}>PF Employer: {formatCurrency(totals.pfEmployer)}</Text>
            <Text style={styles.summaryText}>ESI Employee: {formatCurrency(totals.esiEmployee)}</Text>
            <Text style={styles.summaryText}>ESI Employer: {formatCurrency(totals.esiEmployer)}</Text>
            <Text style={styles.summaryText}>Total Deductions: {formatCurrency(totals.deductions)}</Text>
            <Text style={styles.net}>Net Salary: {formatCurrency(totals.net)}</Text>
          </View>

          <View style={styles.actions}>
            <AppButton icon={selected.salary ? Save : Plus} title={selected.salary ? 'Update Salary' : 'Assign Salary'} loading={loading} onPress={save} />
            {selected.salary ? <AppButton icon={Trash2} title="Delete Salary" variant="danger" onPress={() => confirmDelete()} /> : null}
          </View>
        </Card>
      ) : null}

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
