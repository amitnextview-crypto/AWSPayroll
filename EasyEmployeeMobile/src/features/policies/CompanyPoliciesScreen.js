import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {BookOpenCheck, ShieldCheck} from 'lucide-react-native';
import {getEmployeePayrollPolicies} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const PolicyCard = ({item, index}) => (
  <Card style={styles.policyCard}>
    <View style={styles.policyTop}>
      <View style={[styles.iconBox, {backgroundColor: index % 2 ? '#0b7f8618' : '#2457c518'}]}>
        <ShieldCheck color={index % 2 ? colors.info : colors.primary} size={22} />
      </View>
      <View style={styles.fill}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.category || 'General'}</Text>
      </View>
      <StatusPill value={item.status || 'active'} />
    </View>
    {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
    <View style={styles.rules}>
      {(item.rules || []).map((rule, ruleIndex) => (
        <View key={`${rule.label}-${ruleIndex}`} style={styles.rule}>
          <Text style={styles.ruleLabel}>{rule.label}</Text>
          <Text style={styles.ruleValue}>{rule.value}</Text>
          {rule.note ? <Text style={styles.note}>{rule.note}</Text> : null}
        </View>
      ))}
    </View>
  </Card>
);

export const CompanyPoliciesScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeItems = useMemo(
    () => items.filter(item => (item.status || 'active') === 'active'),
    [items],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEmployeePayrollPolicies();
      setItems(response?.data || []);
    } catch (err) {
      setError(err.message || 'Company policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card style={styles.hero}>
        <View style={styles.policyTop}>
          <BookOpenCheck color={colors.surface} size={26} />
          <View style={styles.fill}>
            <Text style={styles.heroTitle}>Company Policies</Text>
            <Text style={styles.heroText}>All active company rules, leave policies, and payroll guidance in one place.</Text>
          </View>
        </View>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {activeItems.map((item, index) => (
        <PolicyCard key={item._id || item.id || item.title} item={item} index={index} />
      ))}
      {!loading && !activeItems.length ? (
        <EmptyState title="No company policies yet" message="Active company policies added by admin will appear here." />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {backgroundColor: colors.text, borderColor: colors.text},
  heroTitle: {color: colors.surface, fontSize: 22, fontWeight: '900'},
  heroText: {color: '#dbeafe', lineHeight: 21, marginTop: spacing.xs},
  policyCard: {gap: spacing.md},
  policyTop: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  iconBox: {alignItems: 'center', borderRadius: 8, height: 46, justifyContent: 'center', width: 46},
  fill: {flex: 1},
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  description: {color: colors.textMuted, lineHeight: 21},
  rules: {gap: spacing.sm},
  rule: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  ruleLabel: {color: colors.text, fontWeight: '900'},
  ruleValue: {color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs},
  note: {color: colors.info, marginTop: spacing.xs},
  error: {color: colors.danger},
});
