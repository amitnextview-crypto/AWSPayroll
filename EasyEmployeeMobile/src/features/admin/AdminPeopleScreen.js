import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Trash2} from 'lucide-react-native';
import {deleteAdminUser, getAdminAdmins, getAdminEmployees, getAdminLeaders} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const filters = [
  {label: 'Employees', load: getAdminEmployees},
  {label: 'Admins', load: getAdminAdmins},
  {label: 'Leaders', load: getAdminLeaders},
];

export const AdminPeopleScreen = () => {
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await filters[active].load();
      setItems(response?.data || response?.users || []);
    } catch (err) {
      setError(err.message || 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [active]);

  const confirmDelete = user => {
    Alert.alert('Delete user', `Delete ${user?.name || 'this user'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAdminUser(user.id || user._id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View style={styles.tabs}>
        {filters.map((filter, index) => (
          <Text
            key={filter.label}
            onPress={() => setActive(index)}
            style={[styles.tab, active === index && styles.tabActive]}>
            {filter.label}
          </Text>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.map(item => (
        <Card key={item.id || item._id}>
          <View style={styles.row}>
            <View style={styles.fill}>
              <Text style={styles.title}>{item.name || item.username || '-'}</Text>
              <Text style={styles.meta}>{item.email || '-'}</Text>
              <Text style={styles.meta}>{item.mobile || '-'}</Text>
              <Text style={styles.meta}>Role: {item.type || '-'}</Text>
            </View>
            <AppButton icon={Trash2} onPress={() => confirmDelete(item)} title="Delete" variant="danger" />
          </View>
        </Card>
      ))}
      {!loading && !items.length ? <Text style={styles.empty}>No records found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  tabs: {flexDirection: 'row', gap: spacing.sm},
  tab: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    color: colors.text,
    flex: 1,
    fontWeight: '800',
    padding: spacing.md,
    textAlign: 'center',
  },
  tabActive: {backgroundColor: colors.primary, color: colors.surface},
  row: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  fill: {flex: 1},
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
