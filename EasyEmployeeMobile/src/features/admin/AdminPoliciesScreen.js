import React, {useEffect, useMemo, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Plus, Save, Trash2, X} from 'lucide-react-native';
import {
  addPayrollPolicy,
  getPayrollPolicies,
  updatePayrollPolicy,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const emptyPolicy = {
  title: '',
  category: 'General',
  description: '',
  status: 'active',
  rules: [{label: '', value: '', note: ''}],
};

const masterRuleTemplate = {
  title: 'Master Salary Rule',
  category: 'Master Salary Rule',
  description:
    'Controls monthly employee and leader salary from attendance, approved leave, weekly off, and paid holidays.',
  status: 'active',
  rules: [
    {label: 'Fixed Paid Days', value: '26', note: '26 for Sunday off, 22 for Saturday and Sunday off'},
    {label: 'Salary Cycle Start Day', value: '1', note: 'Monthly cycle start date'},
    {label: 'Salary Cycle End Day', value: '31', note: 'Use 31 for month end'},
    {label: 'Annual Start Date', value: '01-04', note: 'DD-MM. Attendance, monthly salary, leave, and expense history resets when this day-month arrives'},
    {label: 'Weekly Off Days', value: 'Sunday', note: 'Use Sunday or Saturday, Sunday. Paid working days are calculated automatically.'},
    {label: 'Approved Leave Paid', value: 'Yes', note: 'Approved leave salary paid'},
    {label: 'Paid Holiday Dates', value: '2026-01-26, 2026-08-15, 2026-10-02', note: 'YYYY-MM-DD comma separated'},
    {label: 'Paid Holiday Names', value: 'Republic Day, Independence Day, Gandhi Jayanti, Diwali, Holi, Makar Sankranti', note: 'Reference names'},
    {label: 'Minimum Full Day Hours', value: '7', note: 'Below this becomes half day'},
    {label: 'Half Day Pay Value', value: '0.5', note: 'Half day salary multiplier'},
    {label: 'Absent Pay Value', value: '0', note: 'Absent salary multiplier'},
    {label: 'Expense Reimbursement Paid', value: 'Yes', note: 'Approved expenses add in total pay'},
  ],
};

const quickRules = [
  {label: 'Fixed Paid Days', value: '26', note: '26 for Sunday off, 22 for Saturday and Sunday off'},
  {label: 'Annual Start Date', value: '01-04', note: 'DD-MM annual payroll data reset date'},
  {label: 'Weekly Off Days', value: 'Sunday', note: 'Sunday or Saturday, Sunday'},
  {label: 'Paid Holiday Dates', value: '2026-01-26, 2026-08-15, 2026-10-02', note: 'YYYY-MM-DD comma separated'},
  {label: 'Approved Leave Paid', value: 'Yes', note: 'Yes or No'},
  {label: 'Minimum Full Day Hours', value: '7', note: 'Below this becomes half day'},
];

const statusItems = [
  {label: 'Active', value: 'active'},
  {label: 'Inactive', value: 'inactive'},
  {label: 'Archived', value: 'archived'},
];

const tabItems = [
  {label: 'Master Rule', value: 'master'},
  {label: 'All Policies', value: 'policies'},
];

export const AdminPoliciesScreen = () => {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyPolicy);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const masterPolicy = useMemo(
    () =>
      items.find(
        item =>
          String(item.title || '').toLowerCase() === 'master salary rule' ||
          String(item.category || '').toLowerCase() === 'master salary rule',
      ),
    [items],
  );

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getPayrollPolicies();
      setItems(response?.data || response?.policies || []);
    } catch (err) {
      setToast(err.message || 'Payroll policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startMasterRule = () => {
    setEditingId(masterPolicy?._id || masterPolicy?.id || 'new');
    setForm(masterPolicy || masterRuleTemplate);
  };

  const setRule = (index, key, value) => {
    setForm(current => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? {...rule, [key]: value} : rule,
      ),
    }));
  };

  const addRule = () => setForm(current => ({...current, rules: [...current.rules, {label: '', value: '', note: ''}]}));

  const addQuickRule = rule => setForm(current => ({...current, rules: [...current.rules, {...rule}]}));

  const removeRule = index => {
    setForm(current => ({
      ...current,
      rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const savePolicy = async () => {
    const payload = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim() || 'General',
      rules: form.rules
        .map(rule => ({label: rule.label.trim(), value: rule.value.trim(), note: String(rule.note || '').trim()}))
        .filter(rule => rule.label && rule.value),
    };
    if (!payload.title) {
      setToast('Policy title is required.');
      return;
    }
    if (!payload.rules.length) {
      setToast('At least one rule is required.');
      return;
    }
    setLoading(true);
    try {
      if (editingId === 'new') {
        await addPayrollPolicy(payload);
        setToast('Policy added successfully.');
      } else {
        await updatePayrollPolicy(editingId, payload);
        setToast('Policy updated successfully.');
      }
      setEditingId('');
      setForm(emptyPolicy);
      load();
    } catch (err) {
      setToast(err.message || 'Policy could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <Card>
      <Text style={styles.title}>Edit Master Salary Rule</Text>
      <Text style={styles.meta}>Only this rule is used for salary cycle, paid days, holidays, leave, half day, expenses, and annual cleanup.</Text>
      <Text style={styles.section}>Rules</Text>
      <View style={styles.quickRules}>
        {quickRules.map(rule => (
          <AppButton key={rule.label} icon={Plus} title={rule.label} variant="muted" onPress={() => addQuickRule(rule)} />
        ))}
      </View>
      {form.rules.map((rule, index) => (
        <View key={String(index)} style={styles.ruleEditor}>
          <AppTextInput label="Rule Name" value={rule.label} onChangeText={value => setRule(index, 'label', value)} style={styles.flex} />
          <AppTextInput label="Rule Value" value={rule.value} onChangeText={value => setRule(index, 'value', value)} style={styles.flex} />
          <AppTextInput label="Note" value={rule.note || ''} onChangeText={value => setRule(index, 'note', value)} style={styles.flex} />
          <AppButton icon={Trash2} title="Remove" variant="muted" disabled={form.rules.length === 1} onPress={() => removeRule(index)} />
        </View>
      ))}
      <View style={styles.actions}>
        <AppButton icon={Plus} title="Add Rule" variant="muted" onPress={addRule} />
        <AppButton icon={Save} title="Save Policy" loading={loading} onPress={savePolicy} />
        <AppButton icon={X} title="Cancel" variant="muted" onPress={() => setEditingId('')} />
      </View>
    </Card>
  );

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />
      <Card>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.heading}>Master Salary Rule</Text>
            <Text style={styles.meta}>One clean payroll policy controls all salary calculations.</Text>
          </View>
          {!editingId ? <AppButton icon={Edit3} title={masterPolicy ? 'Edit' : 'Create'} onPress={startMasterRule} /> : null}
        </View>
      </Card>

      {editingId ? renderForm() : null}

      {!editingId ? (
        <Card>
          {masterPolicy ? (
            <View style={styles.ruleList}>
              {(masterPolicy.rules || []).map((rule, index) => (
                <View key={`${rule.label}-${index}`} style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>{rule.label}</Text>
                  <Text style={styles.ruleValue}>{rule.value}</Text>
                  {rule.note ? <Text style={styles.ruleNote}>{rule.note}</Text> : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.meta}>Create the master rule to control salary cycle, weekly off days, leave, holiday, half day, and expense salary rules.</Text>
          )}
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  heading: {color: colors.text, fontSize: 20, fontWeight: '900'},
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  section: {color: colors.primary, fontWeight: '900', marginTop: spacing.md},
  meta: {color: colors.textMuted, lineHeight: 21, marginTop: spacing.xs},
  header: {alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between'},
  flex: {flex: 1},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  quickRules: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm},
  ruleEditor: {gap: spacing.sm},
  ruleList: {gap: spacing.sm, marginTop: spacing.md},
  ruleRow: {backgroundColor: colors.surfaceMuted, borderRadius: 8, padding: spacing.md},
  ruleLabel: {color: colors.text, fontWeight: '900'},
  ruleValue: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  ruleNote: {color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: spacing.xs},
  more: {color: colors.primary, fontWeight: '900', marginTop: spacing.sm},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
