import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {BriefcaseBusiness, Building2, CalendarCheck, FileCheck, IndianRupee, ReceiptText, ShieldCheck, Users} from 'lucide-react-native';
import {getAdminCounts} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {MetricCard} from '../../components/MetricCard';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminHomeScreen = ({navigation}) => {
  const {user} = useSelector(state => state.auth);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminCounts();
      if (response?.success) {
        setCounts(response.data);
      } else {
        setError(response?.message || 'Dashboard data could not be loaded.');
      }
    } catch (err) {
      setError(err.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadCounts} tintColor={colors.primary} />
      }>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Target Management</Text>
        <Text style={styles.greeting}>Hi, {user?.name || user?.username}</Text>
        <Text style={styles.sub}>Dashboard</Text>
      </View>

      {loading && !counts ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        <MetricCard icon={Users} label="Total Employee" value={counts?.employee} tone="primary" />
        <MetricCard icon={BriefcaseBusiness} label="Total Leader" value={counts?.leader} tone="info" />
        <MetricCard icon={ShieldCheck} label="Total Admin" value={counts?.admin} tone="warning" />
        <MetricCard icon={Building2} label="Total Team" value={counts?.team} tone="success" />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Priority Actions</Text>
        <View style={styles.actions}>
          {[
            ['Employees', Users, 'AdminPeople'],
            ['Attendance', CalendarCheck, 'AdminAttendance'],
            ['Leaves', FileCheck, 'AdminLeaves'],
            ['Expenses', ReceiptText, 'AdminExpenses'],
            ['Salaries', IndianRupee, 'AdminSalaries'],
            ['Policies', ShieldCheck, 'AdminPolicies'],
          ].map(([label, Icon, route]) => (
            <Pressable key={label} onPress={() => navigation.navigate(route)} style={styles.action}>
              <Icon color={colors.primary} size={18} />
              <Text style={styles.actionText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.text,
    borderRadius: 8,
    padding: spacing.xl,
  },
  eyebrow: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  greeting: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '900',
  },
  sub: {
    color: '#dbeafe',
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  meta: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexBasis: '31%',
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 72,
    justifyContent: 'center',
    padding: spacing.sm,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
