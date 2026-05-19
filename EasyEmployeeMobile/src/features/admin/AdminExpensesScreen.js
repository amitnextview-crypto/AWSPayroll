import React, {useEffect, useMemo, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Check, X} from 'lucide-react-native';
import {getAdminAllUsers, getAdminExpenses, updateAdminExpense} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const idOf = item => String(item?.id || item?._id || item || '');
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());
const statusItems = [
  {label: 'All', value: 'all'},
  {label: 'Pending', value: 'Pending'},
  {label: 'Approved', value: 'Approved'},
  {label: 'Rejected', value: 'Rejected'},
];

export const AdminExpensesScreen = () => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [expenseResponse, userResponse] = await Promise.all([getAdminExpenses(), getAdminAllUsers()]);
      const workforce = (userResponse?.data || []).filter(isWorkforce);
      const allowedIds = new Set(workforce.map(idOf));
      setUsers(workforce);
      setItems((expenseResponse?.data || expenseResponse?.expenses || []).filter(item => allowedIds.has(idOf(item.employeeID?._id || item.employeeID))));
    } catch (err) {
      setError(err.message || 'Expenses could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userFor = item => {
    const populated = typeof item.employeeID === 'object' ? item.employeeID : null;
    return populated || users.find(user => idOf(user) === idOf(item.employeeID)) || {};
  };

  const decide = async (item, adminResponse) => {
    try {
      await updateAdminExpense(item.id || item._id, {adminResponse});
      await load();
    } catch (err) {
      setError(err.message || 'Expense could not be updated.');
    }
  };

  const visibleItems = useMemo(() => {
    if (status === 'all') return items;
    return items.filter(item => String(item.adminResponse || 'Pending') === status);
  }, [items, status]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card>
        <Text style={styles.title}>Expense Requests</Text>
        <View style={styles.chipGroup}>
          <FilterChips items={statusItems} value={status} onChange={setStatus} />
        </View>
        <Text style={styles.meta}>{visibleItems.length} records</Text>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {visibleItems.map(item => {
        const user = userFor(item);
        return (
          <Card key={item.id || item._id}>
            <View style={styles.heading}>
              <Text style={styles.title}>{user.name || item.employee?.name || item.user?.name || 'Expense'}</Text>
              <StatusPill value={item.adminResponse || 'Pending'} />
            </View>
            <Text style={styles.meta}>Role: {user.type || '-'}</Text>
            <Text style={styles.meta}>Email: {user.email || '-'}</Text>
            <Text style={styles.meta}>Employee ID: {user.username || '-'}</Text>
            <Text style={styles.meta}>Code: {user.employeeCode || '-'}</Text>
            <Text style={styles.meta}>Type: {item.type || '-'}</Text>
            <Text style={styles.meta}>Date: {item.appliedDate || '-'}</Text>
            <Text style={styles.meta}>Amount: {formatCurrency(item.amount || 0)}</Text>
            <Text style={styles.meta}>Description: {item.description || '-'}</Text>
            <Text style={styles.status}>Status: {item.adminResponse || 'Pending'}</Text>
            <View style={styles.actions}>
              <AppButton icon={Check} disabled={item.adminResponse === 'Approved'} onPress={() => decide(item, 'Approved')} title={item.adminResponse === 'Approved' ? 'Approved' : 'Approve'} variant="success" />
              <AppButton icon={X} disabled={item.adminResponse === 'Rejected'} onPress={() => decide(item, 'Rejected')} title={item.adminResponse === 'Rejected' ? 'Rejected' : 'Reject'} variant="danger" />
            </View>
          </Card>
        );
      })}
      {!loading && !visibleItems.length ? <Text style={styles.empty}>No expenses found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  heading: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between'},
  title: {color: colors.text, flex: 1, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  status: {color: colors.primary, fontWeight: '800', marginTop: spacing.sm},
  actions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.md},
  chipGroup: {marginTop: spacing.sm},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
