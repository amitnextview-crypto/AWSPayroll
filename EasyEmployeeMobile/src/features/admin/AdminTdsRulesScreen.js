import React, {useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Plus, Save, Trash2, X} from 'lucide-react-native';
import {
  addSalaryTaxRule,
  deleteSalaryTaxRule,
  getSalaryTaxRules,
  updateSalaryTaxRule,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatCurrency} from '../../utils/money';

const emptyTaxRule = {label: '', fromAmount: '', toAmount: '', ratePercent: '', sortOrder: ''};
const numeric = value => Number(value || 0);

export const AdminTdsRulesScreen = () => {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(emptyTaxRule);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getSalaryTaxRules();
      setRules(response?.data || []);
    } catch (err) {
      setToast(err.message || 'TDS rules could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key, value) => setForm(current => ({...current, [key]: value}));

  const reset = () => {
    setEditingId('');
    setForm(emptyTaxRule);
  };

  const edit = rule => {
    setEditingId(rule._id || rule.id || '');
    setForm({
      label: rule.label || '',
      fromAmount: String(rule.fromAmount ?? ''),
      toAmount: rule.toAmount === null || rule.toAmount === undefined ? '' : String(rule.toAmount),
      ratePercent: String(rule.ratePercent ?? ''),
      sortOrder: String(rule.sortOrder ?? ''),
    });
  };

  const save = async () => {
    const payload = {
      label: form.label.trim(),
      fromAmount: numeric(form.fromAmount),
      toAmount: form.toAmount === '' ? null : numeric(form.toAmount),
      ratePercent: numeric(form.ratePercent),
      sortOrder: numeric(form.sortOrder),
      status: 'active',
    };
    if (!payload.label) {
      setToast('Rule label is required.');
      return;
    }
    setLoading(true);
    try {
      if (editingId) await updateSalaryTaxRule(editingId, payload);
      else await addSalaryTaxRule(payload);
      const message = editingId ? 'TDS rule updated successfully.' : 'TDS rule added successfully.';
      reset();
      await load();
      setToast(message);
    } catch (err) {
      setToast(err.message || 'TDS rule could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async rule => {
    const id = rule._id || rule.id;
    if (!id) return;
    setLoading(true);
    try {
      await deleteSalaryTaxRule(id);
      if (editingId === id) reset();
      await load();
      setToast('TDS rule deleted successfully.');
    } catch (err) {
      setToast(err.message || 'TDS rule could not be deleted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />

      <Card>
        <Text style={styles.title}>TDS Rules - New Regime</Text>
        <Text style={styles.meta}>These rules are applied automatically while assigning salary.</Text>
        <View style={styles.twoCol}>
          <AppTextInput label="Rule Label" value={form.label} onChangeText={value => set('label', value)} style={styles.flex} />
          <AppTextInput label="Rate %" keyboardType="numeric" value={form.ratePercent} onChangeText={value => set('ratePercent', value.replace(/[^0-9.]/g, ''))} style={styles.flex} />
        </View>
        <View style={styles.twoCol}>
          <AppTextInput label="From" keyboardType="numeric" value={form.fromAmount} onChangeText={value => set('fromAmount', value.replace(/[^0-9.]/g, ''))} style={styles.flex} />
          <AppTextInput label="To (blank = no limit)" keyboardType="numeric" value={form.toAmount} onChangeText={value => set('toAmount', value.replace(/[^0-9.]/g, ''))} style={styles.flex} />
        </View>
        <AppTextInput label="Sort Order" keyboardType="numeric" value={form.sortOrder} onChangeText={value => set('sortOrder', value.replace(/[^0-9.]/g, ''))} />
        <View style={styles.actions}>
          <AppButton icon={editingId ? Save : Plus} title={editingId ? 'Update Rule' : 'Add Rule'} loading={loading} onPress={save} />
          {editingId ? <AppButton icon={X} title="Cancel" variant="muted" onPress={reset} /> : null}
        </View>
      </Card>

      {rules.map(rule => (
        <Card key={rule._id || rule.id || rule.label}>
          <View style={styles.ruleRow}>
            <View style={styles.flex}>
              <Text style={styles.ruleLabel}>{rule.label}</Text>
              <Text style={styles.meta}>
                {formatCurrency(numeric(rule.fromAmount))} - {rule.toAmount ? formatCurrency(numeric(rule.toAmount)) : 'No limit'} @ {numeric(rule.ratePercent)}%
              </Text>
              <Text style={styles.meta}>Sort: {rule.sortOrder ?? '-'}</Text>
            </View>
            <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => edit(rule)} />
            <AppButton icon={Trash2} title="Delete" variant="danger" onPress={() => remove(rule)} />
          </View>
        </Card>
      ))}

      {!loading && !rules.length ? <Text style={styles.empty}>No TDS rules found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.sm},
  meta: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  ruleRow: {alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  ruleLabel: {color: colors.text, fontSize: 16, fontWeight: '900'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
