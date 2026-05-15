import React, {useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Check, X} from 'lucide-react-native';
import {getAdminExpenses, updateAdminExpense} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminExpensesScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminExpenses();
      setItems(response?.data || response?.expenses || []);
    } catch (err) {
      setError(err.message || 'Expenses could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (item, adminResponse) => {
    await updateAdminExpense(item.id || item._id, {adminResponse});
    load();
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.map(item => (
        <Card key={item.id || item._id}>
          <Text style={styles.title}>{item.employee?.name || item.user?.name || item.type || 'Expense'}</Text>
          <Text style={styles.meta}>Type: {item.type || '-'}</Text>
          <Text style={styles.meta}>Amount: {item.amount || '-'}</Text>
          <Text style={styles.meta}>Description: {item.description || '-'}</Text>
          <Text style={styles.status}>Status: {item.adminResponse || 'Pending'}</Text>
          <View style={styles.actions}>
            <AppButton icon={Check} onPress={() => decide(item, 'Approved')} title="Approve" variant="success" />
            <AppButton icon={X} onPress={() => decide(item, 'Rejected')} title="Reject" variant="danger" />
          </View>
        </Card>
      ))}
      {!loading && !items.length ? <Text style={styles.empty}>No expenses found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  status: {color: colors.primary, fontWeight: '800', marginTop: spacing.sm},
  actions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.md},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
