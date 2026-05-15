import React, {useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, Text} from 'react-native';
import {getPayrollPolicies} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminPoliciesScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPayrollPolicies();
      setItems(response?.data || response?.policies || []);
    } catch (err) {
      setError(err.message || 'Payroll policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.map((item, index) => (
        <Card key={item.id || item._id || String(index)}>
          <Text style={styles.title}>{item.name || item.title || 'Payroll policy'}</Text>
          {Object.entries(item).map(([key, value]) =>
            key === '_id' || typeof value === 'object' ? null : (
              <Text key={key} style={styles.meta}>{key}: {String(value)}</Text>
            ),
          )}
        </Card>
      ))}
      {!loading && !items.length ? <Text style={styles.empty}>No payroll policies found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
