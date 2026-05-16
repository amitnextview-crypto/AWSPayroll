import React, {useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Download, FileText, RefreshCw} from 'lucide-react-native';
import {calculateCurrentMonthSalaries, generateAdminMonthlySalaries, getAdminSalaries} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

export const AdminSalaryScreen = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminSalaries({});
      setItems(response?.data || response?.salaries || []);
    } catch (err) {
      setError(err.message || 'Salaries could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      await calculateCurrentMonthSalaries();
      await generateAdminMonthlySalaries({});
      await load();
    } catch (err) {
      setError(err.message || 'Monthly salaries could not be generated.');
      setLoading(false);
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <AppButton icon={RefreshCw} loading={loading} onPress={generate} title="Generate monthly salaries" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Card>
        <Text style={styles.title}>Salary Records</Text>
        <AppTextInput label="Search employee, email, code" value={search} onChangeText={setSearch} />
        <View style={styles.actions}>
          <AppButton icon={Download} title="Export" variant="muted" onPress={() => setError('Export will use the hosted payroll records API when file storage is enabled.')} />
        </View>
      </Card>
      {items
        .filter(item => {
          const employee = item.employeeID || item.employee || item.user || {};
          const text = `${employee.name || item.name || ''} ${employee.email || ''} ${employee.username || ''}`.toLowerCase();
          return text.includes(search.toLowerCase());
        })
        .map((item, index) => {
          const employee = item.employeeID || item.employee || item.user || {};
          const earnings = item.earnings || {};
          const deductions = item.deductions || {};
          return (
        <Card key={item.id || item._id || String(index)}>
          <Text style={styles.title}>{employee.name || item.name || 'Salary'}</Text>
          <Text style={styles.meta}>Employee ID: {employee.username || '-'}</Text>
          <Text style={styles.meta}>Email: {employee.email || '-'}</Text>
          <Text style={styles.meta}>Employee code: {employee.employeeCode || '-'}</Text>
          <Text style={styles.meta}>Basic: {formatCurrency(earnings.basic || 0)}</Text>
          <Text style={styles.meta}>HRA: {formatCurrency(earnings.hra || 0)}</Text>
          <Text style={styles.meta}>Allowance: {formatCurrency(earnings.specialAllowance || 0)}</Text>
          <Text style={styles.meta}>Bonus: {formatCurrency(earnings.bonus || 0)}</Text>
          <Text style={styles.meta}>Deductions: {formatCurrency(deductions.totalDeductions || 0)}</Text>
          <Text style={styles.net}>Net Salary: {formatCurrency(item.netPay || item.netSalary || item.net || item.payableSalary || 0)}</Text>
          <View style={styles.actions}>
            <AppButton icon={FileText} title="Salary Slip" variant="muted" onPress={() => setError('Salary slip generation API is available from payroll email action.')} />
          </View>
        </Card>
      );
        })}
      {!loading && !items.length ? <Text style={styles.empty}>No salary records found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  net: {color: colors.text, fontWeight: '900', marginTop: spacing.sm},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
