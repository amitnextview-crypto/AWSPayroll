import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {getSalary} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const MoneyRow = ({label, value}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{formatCurrency(value)}</Text>
  </View>
);

export const SalaryScreen = () => {
  const {user} = useSelector(state => state.auth);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSalary({employeeID: user.id});
      setSalary(response?.data?.[0] || null);
    } catch (error) {
      Alert.alert('Salary', error.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !salary) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!salary) {
    return (
      <Screen>
        <EmptyState title="No salary assigned" message="Your assigned salary details will appear after admin setup." />
      </Screen>
    );
  }

  const {earnings = {}, deductions = {}, netPay, assignedDate, month, year} = salary;

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        eyebrow="Compensation"
        title="Salary Details"
        subtitle="Assigned earnings, deductions, and net pay structure."
      />
      <Card>
        <Text style={styles.title}>Net Pay</Text>
        <Text style={styles.subtitle}>{month || '-'} / {year || '-'} | Assigned {assignedDate || '-'}</Text>
        <Text style={styles.netPay}>{formatCurrency(netPay)}</Text>
        <Text style={styles.subtitle}>Net pay</Text>
      </Card>

      <Card>
        <Text style={styles.section}>Earnings</Text>
        <MoneyRow label="Basic" value={earnings.basic} />
        <MoneyRow label="HRA" value={earnings.hra} />
        <MoneyRow label="Conveyance" value={earnings.conveyance} />
        <MoneyRow label="Medical" value={earnings.medical} />
        <MoneyRow label="Special Allowance" value={earnings.specialAllowance} />
        <MoneyRow label="Overtime Pay" value={earnings.overtimePay} />
        <MoneyRow label="Bonus" value={earnings.bonus} />
        <MoneyRow label="Other Benefits" value={earnings.otherBenefits} />
        <MoneyRow label="Gross" value={earnings.gross} />
      </Card>

      <Card>
        <Text style={styles.section}>Deductions</Text>
        <MoneyRow label="PF Employee" value={deductions.pfEmployee} />
        <MoneyRow label="ESI Employee" value={deductions.esiEmployee} />
        <MoneyRow label="Professional Tax" value={deductions.professionalTax} />
        <MoneyRow label="Loan Recovery" value={deductions.loanRecovery} />
        <MoneyRow label="TDS Monthly" value={deductions.tdsMonthly} />
        <MoneyRow label="Total Deductions" value={deductions.totalDeductions} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  netPay: {
    color: colors.success,
    fontSize: 32,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  section: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontWeight: '800',
  },
});
