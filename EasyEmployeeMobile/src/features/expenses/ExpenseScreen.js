import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Plus, Trash2} from 'lucide-react-native';
import {addExpense, deleteExpense, getEmployeeExpenses} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatApiDate} from '../../utils/date';

export const ExpenseScreen = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({type: '', amount: '', description: ''});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEmployeeExpenses();
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

  const submit = async () => {
    if (!form.type || !form.amount) {
      setError('Type and amount are required.');
      return;
    }
    setLoading(true);
    try {
      await addExpense({...form, amount: Number(form.amount), appliedDate: formatApiDate()});
      setForm({type: '', amount: '', description: ''});
      await load();
    } catch (err) {
      setError(err.message || 'Expense could not be submitted.');
      setLoading(false);
    }
  };

  const remove = item => {
    Alert.alert('Delete expense', 'Delete this expense?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteExpense(item.id || item._id);
        load();
      }},
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card>
        <AppTextInput label="Expense type" value={form.type} onChangeText={type => setForm({...form, type})} />
        <AppTextInput label="Amount" keyboardType="numeric" value={form.amount} onChangeText={amount => setForm({...form, amount})} />
        <AppTextInput label="Description" value={form.description} onChangeText={description => setForm({...form, description})} />
        <AppButton icon={Plus} loading={loading} onPress={submit} title="Submit expense" />
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.map(item => (
        <Card key={item.id || item._id}>
          <View style={styles.row}>
            <View style={styles.fill}>
              <Text style={styles.title}>{item.type || 'Expense'}</Text>
              <Text style={styles.meta}>Amount: {item.amount || '-'}</Text>
              <Text style={styles.meta}>Status: {item.adminResponse || 'Pending'}</Text>
              <Text style={styles.meta}>{item.description || '-'}</Text>
            </View>
            <AppButton icon={Trash2} onPress={() => remove(item)} title="Delete" variant="danger" />
          </View>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  fill: {flex: 1},
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
});
