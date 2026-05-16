import React, {useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {FileText} from 'lucide-react-native';
import {
  assignAdminSalary,
  getAdminAllUsers,
  getSalaryTaxRules,
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
const STANDARD_DEDUCTION = 75000;
const REBATE_LIMIT = 1200000;
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());

const fallbackTaxRules = [
  {label: 'Up to 4,00,000', fromAmount: 0, toAmount: 400000, ratePercent: 0},
  {label: '4,00,001 to 8,00,000', fromAmount: 400000, toAmount: 800000, ratePercent: 5},
  {label: '8,00,001 to 12,00,000', fromAmount: 800000, toAmount: 1200000, ratePercent: 10},
  {label: '12,00,001 to 16,00,000', fromAmount: 1200000, toAmount: 1600000, ratePercent: 15},
  {label: '16,00,001 to 20,00,000', fromAmount: 1600000, toAmount: 2000000, ratePercent: 20},
  {label: '20,00,001 to 24,00,000', fromAmount: 2000000, toAmount: 2400000, ratePercent: 25},
  {label: 'Above 24,00,000', fromAmount: 2400000, toAmount: null, ratePercent: 30},
];

export const AdminAssignSalaryScreen = ({navigation}) => {
  const [employees, setEmployees] = useState([]);
  const [employeeID, setEmployeeID] = useState('');
  const [form, setForm] = useState(emptySalary);
  const [search, setSearch] = useState('');
  const [taxRules, setTaxRules] = useState(fallbackTaxRules);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const loadTaxRules = async () => {
    const response = await getSalaryTaxRules();
    setTaxRules(response?.data?.length ? response.data : fallbackTaxRules);
  };

  useEffect(() => {
    Promise.all([getAdminAllUsers(), loadTaxRules()])
      .then(([employeeResponse, taxResponse]) => {
        setEmployees((employeeResponse?.data || []).filter(isWorkforce));
      })
      .catch(err => setToast(err.message || 'Employees could not be loaded.'));
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTaxRules().catch(err => setToast(err.message || 'TDS rules could not be loaded.'));
    });
    return unsubscribe;
  }, [navigation]);

  const calculateAnnualTax = (annualGross, rules) => {
    const taxableIncome = Math.max(annualGross - STANDARD_DEDUCTION, 0);
    if (taxableIncome <= REBATE_LIMIT) {
      return {taxableIncome, annualTax: 0, monthlyTDS: 0, taxBreakup: []};
    }
    const sortedRules = [...rules].sort((a, b) => numeric(a.fromAmount) - numeric(b.fromAmount));
    const taxBreakup = sortedRules.map(rule => {
      const from = numeric(rule.fromAmount);
      const to = rule.toAmount === null || rule.toAmount === '' || rule.toAmount === undefined ? Infinity : numeric(rule.toAmount);
      const taxableInSlab = Math.max(Math.min(taxableIncome, to) - from, 0);
      const tax = (taxableInSlab * numeric(rule.ratePercent)) / 100;
      return {...rule, taxableInSlab, tax};
    }).filter(item => item.taxableInSlab > 0);
    const taxBeforeCess = taxBreakup.reduce((sum, item) => sum + item.tax, 0);
    const cess = taxBeforeCess * 0.04;
    const annualTax = taxBeforeCess + cess;
    return {taxableIncome, taxBreakup, taxBeforeCess, cess, annualTax, monthlyTDS: annualTax / 12};
  };

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
    const annualGross = gross * 12;
    const tax = calculateAnnualTax(annualGross, taxRules);
    const tdsMonthly = numeric(form.tdsMonthlyOverride) || tax.monthlyTDS;
    const deductions = pfEmployee + esiEmployee + numeric(form.professionalTax) + numeric(form.loanRecovery) + tdsMonthly;
    return {gross, deductions, net: Math.max(gross - deductions, 0), overtimePay, pfEmployee, pfEmployer, esiEmployee, esiEmployer, tdsMonthly, annualGross, tax};
  }, [form, taxRules]);

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
        <View style={styles.actions}>
          <AppButton icon={FileText} title="TDS Rules" variant="muted" onPress={() => navigation.navigate('AdminTdsRules')} />
        </View>
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
          <Text style={styles.employeeId}>Selected ID: {selectedEmployee._id || selectedEmployee.id} / {selectedEmployee.email}</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.title}>Salary Components</Text>

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
          <Text style={styles.summaryText}>Monthly Gross: {formatCurrency(totals.gross)}</Text>
          <Text style={styles.summaryText}>Annual Gross: {formatCurrency(totals.annualGross)}</Text>
          <Text style={styles.summaryText}>Taxable Income: {formatCurrency(totals.tax.taxableIncome || 0)}</Text>
          <Text style={styles.summaryText}>PF Employee: {formatCurrency(totals.pfEmployee)} (12% capped at {formatCurrency(PF_AMOUNT_LIMIT)})</Text>
          <Text style={styles.summaryText}>PF Employer: {formatCurrency(totals.pfEmployer)} (company contribution)</Text>
          <Text style={styles.summaryText}>ESI Employee: {formatCurrency(totals.esiEmployee)}</Text>
          <Text style={styles.summaryText}>ESI Employer: {formatCurrency(totals.esiEmployer)} (company contribution)</Text>
          <Text style={styles.summaryText}>Professional Tax: {formatCurrency(numeric(form.professionalTax))}</Text>
          <Text style={styles.summaryText}>Loan Recovery: {formatCurrency(numeric(form.loanRecovery))}</Text>
          <Text style={styles.summaryText}>TDS Deduction Monthly: {formatCurrency(totals.tdsMonthly)}</Text>
          <Text style={styles.summaryText}>TDS Annual: {formatCurrency(totals.tax.annualTax || 0)} including 4% cess</Text>
          {totals.tax.taxBreakup?.map(item => (
            <Text key={item.label} style={styles.summaryText}>{item.label}: {formatCurrency(item.taxableInSlab)} @ {item.ratePercent}% = {formatCurrency(item.tax)}</Text>
          ))}
          <Text style={styles.summaryText}>Total Deductions: {formatCurrency(totals.deductions)}</Text>
          <Text style={styles.net}>Net Salary: {formatCurrency(totals.net)}</Text>
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
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  ruleRow: {alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm},
  ruleLabel: {color: colors.text, fontWeight: '900'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  summary: {backgroundColor: colors.surfaceMuted, borderRadius: 8, gap: spacing.xs, marginVertical: spacing.md, padding: spacing.md},
  summaryText: {color: colors.textMuted, fontWeight: '800'},
  net: {color: colors.text, fontSize: 18, fontWeight: '900'},
});
