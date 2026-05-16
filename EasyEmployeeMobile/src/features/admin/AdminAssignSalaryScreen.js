import React, {useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {assignAdminSalary, getAdminEmployees} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const emptySalary = {
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
  tdsMonthlyOverride: '',
};

const numeric = value => Number(value || 0);
const PF_AMOUNT_LIMIT = 1800;

export const AdminAssignSalaryScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeID, setEmployeeID] = useState('');
  const [form, setForm] = useState(emptySalary);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getAdminEmployees({limit: 100})
      .then(response => setEmployees(response?.data || []))
      .catch(err => setToast(err.message || 'Employees could not be loaded.'));
  }, []);

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
    const pfEmployeeRaw = (numeric(form.basic) * numeric(form.pfEmployeePercent)) / 100;
    const pfEmployerRaw = (numeric(form.basic) * numeric(form.pfEmployerPercent)) / 100;
    const pfEmployee = Math.min(pfEmployeeRaw, PF_AMOUNT_LIMIT);
    const pfEmployer = Math.min(pfEmployerRaw, PF_AMOUNT_LIMIT);
    const esiEmployee = (gross * numeric(form.esiEmployeePercent)) / 100;
    const esiEmployer = (gross * numeric(form.esiEmployerPercent)) / 100;
    const tdsMonthly = numeric(form.tdsMonthlyOverride);
    const deductions = pfEmployee + esiEmployee + numeric(form.professionalTax) + numeric(form.loanRecovery) + tdsMonthly;
    return {gross, deductions, net: Math.max(gross - deductions, 0), overtimePay, pfEmployee, pfEmployer, esiEmployee, esiEmployer, tdsMonthly};
  }, [form]);

  const selectedEmployee = employees.find(employee => (employee.id || employee._id) === employeeID);
  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(employee =>
      `${employee.name || ''} ${employee.email || ''} ${employee.employeeCode || ''} ${employee.username || ''} ${employee._id || employee.id || ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [employees, search]);

  const set = (key, value) => setForm(current => ({...current, [key]: value.replace(/[^0-9.]/g, '')}));

  const submit = async () => {
    if (!employeeID) {
      setToast('Select employee.');
      return;
    }
    if (!numeric(form.basic)) {
      setToast('Basic salary is required.');
      return;
    }
    setLoading(true);
    setToast('');
    try {
      const response = await assignAdminSalary({
        employeeID,
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
          tdsMonthly: totals.tdsMonthly,
          totalDeductions: totals.deductions,
        },
        netPay: totals.net,
      });
      Alert.alert('Salary', response?.message || 'Salary assigned.');
      setForm(emptySalary);
    } catch (err) {
      setToast(err.message || 'Salary could not be assigned.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ToastBanner message={toast} onHide={() => setToast('')} />
      <Card>
        <Text style={styles.title}>Assign Salary Structure</Text>
        <Text style={styles.label}>Employee</Text>
        <AppTextInput label="Search employee" value={search} onChangeText={setSearch} />
        <FilterChips
          value={employeeID}
          onChange={setEmployeeID}
          items={filteredEmployees.map(employee => ({
            value: employee.id || employee._id,
            label: `${employee.name || employee.username} (${employee.employeeCode || employee.username})`,
          }))}
        />
        {selectedEmployee ? (
          <Text style={styles.employeeId}>Selected ID: {selectedEmployee._id || selectedEmployee.id}</Text>
        ) : null}

        <Text style={styles.section}>Earnings</Text>
        <View style={styles.twoCol}>
          <AppTextInput label="Basic Salary" keyboardType="numeric" value={form.basic} onChangeText={value => set('basic', value)} style={styles.flex} />
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
        <AppTextInput label="TDS Monthly" keyboardType="numeric" value={form.tdsMonthlyOverride} onChangeText={value => set('tdsMonthlyOverride', value)} />

        <View style={styles.summary}>
          <Text style={styles.summaryText}>Gross: {formatCurrency(totals.gross)}</Text>
          <Text style={styles.summaryText}>PF Employee: {formatCurrency(totals.pfEmployee)}</Text>
          <Text style={styles.summaryText}>ESI Employee: {formatCurrency(totals.esiEmployee)}</Text>
          <Text style={styles.summaryText}>Deductions: {formatCurrency(totals.deductions)}</Text>
          <Text style={styles.net}>Net Salary: {formatCurrency(totals.net)}</Text>
          <Text style={styles.summaryText}>Yearly Gross: {formatCurrency(totals.gross * 12)}</Text>
          <Text style={styles.summaryText}>Yearly Net: {formatCurrency(totals.net * 12)}</Text>
        </View>
        <AppButton loading={loading} onPress={submit} title="Assign Salary" />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  label: {color: colors.text, fontSize: 13, fontWeight: '800'},
  employeeId: {color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: spacing.xs},
  section: {color: colors.primary, fontSize: 14, fontWeight: '900', marginTop: spacing.lg},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  summary: {backgroundColor: colors.surfaceMuted, borderRadius: 8, gap: spacing.xs, marginVertical: spacing.md, padding: spacing.md},
  summaryText: {color: colors.textMuted, fontWeight: '800'},
  net: {color: colors.text, fontSize: 18, fontWeight: '900'},
});
