import React, {useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, Text} from 'react-native';
import {RefreshCw} from 'lucide-react-native';
import {calculateCurrentMonthSalaries, generateAdminMonthlySalaries, getAdminSalaries} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

export const AdminSalaryScreen = () => {
  const [items, setItems] = useState([]);
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
      {items.map((item, index) => (
        <Card key={item.id || item._id || String(index)}>
          <Text style={styles.title}>{item.employee?.name || item.user?.name || item.name || 'Salary'}</Text>
          <Text style={styles.meta}>Month: {item.month || '-'}</Text>
          <Text style={styles.meta}>Year: {item.year || '-'}</Text>
          <Text style={styles.meta}>Gross: {formatCurrency(item.grossSalary || item.gross || item.salary)}</Text>
          <Text style={styles.meta}>Net: {formatCurrency(item.netSalary || item.net || item.payableSalary)}</Text>
        </Card>
      ))}
      {!loading && !items.length ? <Text style={styles.empty}>No salary records found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
