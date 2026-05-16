import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Plus, Save, Trash2, X} from 'lucide-react-native';
import {
  addPayrollPolicy,
  deletePayrollPolicy,
  getPayrollPolicies,
  updatePayrollPolicy,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const emptyPolicy = {
  title: '',
  category: 'General',
  description: '',
  status: 'active',
  rules: [{label: '', value: ''}],
};

const statusItems = [
  {label: 'Active', value: 'active'},
  {label: 'Inactive', value: 'inactive'},
  {label: 'Archived', value: 'archived'},
];

export const AdminPoliciesScreen = () => {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyPolicy);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
    return [{label: 'All', value: ''}, ...unique.map(value => ({label: value, value}))];
  }, [items]);

  const visibleItems = useMemo(() => {
    const lower = search.toLowerCase();
    return items.filter(item => {
      const haystack = `${item.title} ${item.category} ${(item.rules || [])
        .map(rule => `${rule.label} ${rule.value}`)
        .join(' ')}`.toLowerCase();
      return (!category || item.category === category) && haystack.includes(lower);
    });
  }, [items, search, category]);

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

  const startAdd = () => {
    setEditingId('new');
    setForm(emptyPolicy);
  };

  const startEdit = item => {
    setEditingId(item._id || item.id);
    setForm({
      title: item.title || '',
      category: item.category || 'General',
      description: item.description || '',
      status: item.status || 'active',
      rules: item.rules?.length ? item.rules.map(rule => ({label: rule.label || '', value: rule.value || ''})) : [{label: '', value: ''}],
    });
  };

  const setRule = (index, key, value) => {
    setForm(current => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? {...rule, [key]: value} : rule,
      ),
    }));
  };

  const addRule = () => setForm(current => ({...current, rules: [...current.rules, {label: '', value: ''}]}));

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
        .map(rule => ({label: rule.label.trim(), value: rule.value.trim()}))
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

  const confirmDelete = item => {
    Alert.alert('Delete policy', `Delete ${item.title}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePayrollPolicy(item._id || item.id);
            setToast('Policy deleted successfully.');
            load();
          } catch (err) {
            setToast(err.message || 'Policy could not be deleted.');
          }
        },
      },
    ]);
  };

  const renderForm = () => (
    <Card>
      <Text style={styles.title}>{editingId === 'new' ? 'Add New Policy' : 'Edit Policy'}</Text>
      <AppTextInput label="Policy Title" value={form.title} onChangeText={value => setForm(current => ({...current, title: value}))} />
      <View style={styles.twoCol}>
        <AppTextInput label="Category" value={form.category} onChangeText={value => setForm(current => ({...current, category: value}))} style={styles.flex} />
        <AppTextInput label="Description" value={form.description} onChangeText={value => setForm(current => ({...current, description: value}))} style={styles.flex} />
      </View>
      <FilterChips items={statusItems} value={form.status} onChange={value => setForm(current => ({...current, status: value}))} />
      <Text style={styles.section}>Rules</Text>
      {form.rules.map((rule, index) => (
        <View key={String(index)} style={styles.ruleEditor}>
          <AppTextInput label="Rule Name" value={rule.label} onChangeText={value => setRule(index, 'label', value)} style={styles.flex} />
          <AppTextInput label="Rule Value" value={rule.value} onChangeText={value => setRule(index, 'value', value)} style={styles.flex} />
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
            <Text style={styles.heading}>Payroll Policies</Text>
            <Text style={styles.meta}>Default corporate policies and custom admin policies</Text>
          </View>
          <AppButton icon={Plus} title="Add New Policy" onPress={startAdd} />
        </View>
        <AppTextInput label="Search policies or rules" value={search} onChangeText={setSearch} />
        <FilterChips items={categories} value={category} onChange={setCategory} />
      </Card>

      {editingId ? renderForm() : null}

      {visibleItems.map(item => {
        const id = item._id || item.id;
        const isExpanded = expanded[id] ?? false;
        const rules = isExpanded ? item.rules || [] : (item.rules || []).slice(0, 4);
        return (
          <Card key={id}>
            <Pressable onPress={() => setExpanded(current => ({...current, [id]: !isExpanded}))}>
              <View style={styles.header}>
                <View style={styles.flex}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>{item.category} / {item.rules?.length || 0} rules</Text>
                </View>
                <StatusPill value={item.status || 'active'} />
              </View>
            </Pressable>
            {item.description ? <Text style={styles.meta}>{item.description}</Text> : null}
            <View style={styles.ruleList}>
              {rules.map((rule, index) => (
                <View key={`${rule.label}-${index}`} style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>{rule.label}</Text>
                  <Text style={styles.ruleValue}>{rule.value}</Text>
                </View>
              ))}
            </View>
            {(item.rules?.length || 0) > 4 ? (
              <Text style={styles.more}>{isExpanded ? 'Show less' : `Show ${item.rules.length - 4} more rules`}</Text>
            ) : null}
            <View style={styles.actions}>
              <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => startEdit(item)} />
              <AppButton icon={Trash2} title="Delete" variant="danger" onPress={() => confirmDelete(item)} />
            </View>
          </Card>
        );
      })}
      {!loading && !visibleItems.length ? <Text style={styles.empty}>No payroll policies found.</Text> : null}
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
  ruleEditor: {gap: spacing.sm},
  ruleList: {gap: spacing.sm, marginTop: spacing.md},
  ruleRow: {backgroundColor: colors.surfaceMuted, borderRadius: 8, padding: spacing.md},
  ruleLabel: {color: colors.text, fontWeight: '900'},
  ruleValue: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  more: {color: colors.primary, fontWeight: '900', marginTop: spacing.sm},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
