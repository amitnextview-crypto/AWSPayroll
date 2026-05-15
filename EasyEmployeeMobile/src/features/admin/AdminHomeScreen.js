import React, {useEffect, useState} from 'react';
import {ActivityIndicator, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {getAdminCounts} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const CountCard = ({label, value}) => (
  <Card style={styles.countCard}>
    <Text style={styles.countValue}>{value ?? '-'}</Text>
    <Text style={styles.countLabel}>{label}</Text>
  </Card>
);

export const AdminHomeScreen = () => {
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
      <View>
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
        <Text style={styles.sub}>Admin dashboard</Text>
      </View>

      {loading && !counts ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        <CountCard label="Admins" value={counts?.admin} />
        <CountCard label="Employees" value={counts?.employee} />
        <CountCard label="Leaders" value={counts?.leader} />
        <CountCard label="Teams" value={counts?.team} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Access</Text>
        <Text style={styles.meta}>
          Admin APIs are connected. Employee management, leave approvals, salary setup, and team actions can be added here as full admin screens.
        </Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  sub: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  countCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
  },
  countValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
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
});
