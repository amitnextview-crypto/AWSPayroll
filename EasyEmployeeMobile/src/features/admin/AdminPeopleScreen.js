import React, {useEffect, useMemo, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Power, Trash2} from 'lucide-react-native';
import {
  deleteAdminUser,
  getAdminAdmins,
  getAdminEmployees,
  getAdminLeaders,
  updateAdminUser,
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

const tabs = [
  {label: 'Employees', value: 'employees', load: getAdminEmployees},
  {label: 'Leaders', value: 'leaders', load: getAdminLeaders},
  {label: 'Admins', value: 'admins', load: getAdminAdmins},
];

const statusOptions = [
  {label: 'All Status', value: ''},
  {label: 'Active', value: 'active'},
  {label: 'Inactive', value: 'banned'},
];

export const AdminPeopleScreen = ({route}) => {
  const initial = tabs.find(item => item.value === route.params?.filter) || tabs[0];
  const [active, setActive] = useState(initial.value);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({page: 1, pages: 1, total: 0});
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    designation: '',
    status: '',
    joiningFrom: '',
    joiningTo: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const activeTab = useMemo(() => tabs.find(item => item.value === active) || tabs[0], [active]);

  const load = async (page = 1) => {
    setLoading(true);
    setToast('');
    try {
      const params = Object.fromEntries(
        Object.entries({...filters, page, limit: 20}).filter(([, value]) => value !== ''),
      );
      const response = await activeTab.load(params);
      setItems(response?.data || []);
      setPagination(response?.pagination || {page, pages: 1, total: response?.data?.length || 0});
    } catch (err) {
      setToast(err.message || 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [active, filters.status]);

  const setFilter = (key, value) => setFilters(current => ({...current, [key]: value}));

  const confirmDelete = user => {
    Alert.alert('Delete user', `Delete ${user?.name || 'this user'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminUser(user.id || user._id);
            setToast('User deleted successfully.');
            load(pagination.page);
          } catch (err) {
            setToast(err.message || 'User could not be deleted.');
          }
        },
      },
    ]);
  };

  const toggleStatus = async user => {
    const id = user.id || user._id;
    const isActive = String(user.status).toLowerCase() === 'active';
    try {
      await updateAdminUser(id, {status: isActive ? 'banned' : 'active'});
      setToast(isActive ? 'User deactivated.' : 'User activated.');
      load(pagination.page);
    } catch (err) {
      setToast(err.message || 'Status could not be updated.');
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(pagination.page)} />}>
      <FilterChips items={tabs} value={active} onChange={setActive} />
      <ToastBanner message={toast} type={toast.includes('success') || toast.includes('activated') ? 'success' : 'error'} onHide={() => setToast('')} />

      <Card>
        <Text style={styles.title}>Search and Filters</Text>
        <AppTextInput label="Search name, email, mobile, employee code" value={filters.search} onChangeText={value => setFilter('search', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Department" value={filters.department} onChangeText={value => setFilter('department', value)} style={styles.flex} />
          <AppTextInput label="Designation" value={filters.designation} onChangeText={value => setFilter('designation', value)} style={styles.flex} />
        </View>
        <FilterChips items={statusOptions} value={filters.status} onChange={value => setFilter('status', value)} />
        <View style={styles.twoCol}>
          <AppTextInput label="Joining from YYYY-MM-DD" value={filters.joiningFrom} onChangeText={value => setFilter('joiningFrom', value)} style={styles.flex} />
          <AppTextInput label="Joining to YYYY-MM-DD" value={filters.joiningTo} onChangeText={value => setFilter('joiningTo', value)} style={styles.flex} />
        </View>
        <AppButton title="Apply Filters" loading={loading} onPress={() => load(1)} />
      </Card>

      <Text style={styles.count}>{pagination.total || items.length} records</Text>
      {items.map(item => (
        <Card key={item.id || item._id}>
          <View style={styles.row}>
            <View style={styles.fill}>
              <View style={styles.headingRow}>
                <Text style={styles.name}>{item.name || item.username || '-'}</Text>
                <StatusPill value={item.status || item.type || '-'} />
              </View>
              <Text style={styles.meta}>{item.employeeCode || item.username || '-'}</Text>
              <Text style={styles.meta}>{item.email || '-'}</Text>
              <Text style={styles.meta}>{item.mobile || '-'}</Text>
              <Text style={styles.meta}>{item.department || 'No department'} / {item.designation || '-'}</Text>
              <Text style={styles.meta}>Joining: {item.date || '-'}</Text>
              <Text style={styles.meta}>Team: {item.team?.name || '-'}</Text>
              {item.documents?.length ? <Text style={styles.meta}>Documents: {item.documents.length}</Text> : null}
            </View>
          </View>
          <View style={styles.actions}>
            <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => Alert.alert('Edit employee', 'Open Add User to update full profile fields with this employee data.')} />
            <AppButton icon={Power} title={String(item.status).toLowerCase() === 'active' ? 'Deactivate' : 'Activate'} variant="muted" onPress={() => toggleStatus(item)} />
            <AppButton icon={Trash2} onPress={() => confirmDelete(item)} title="Delete" variant="danger" />
          </View>
        </Card>
      ))}

      <View style={styles.pagination}>
        <AppButton title="Previous" variant="muted" disabled={pagination.page <= 1 || loading} onPress={() => load(pagination.page - 1)} />
        <Text style={styles.page}>Page {pagination.page} / {pagination.pages}</Text>
        <AppButton title="Next" variant="muted" disabled={pagination.page >= pagination.pages || loading} onPress={() => load(pagination.page + 1)} />
      </View>
      {!loading && !items.length ? <Text style={styles.empty}>No records found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: spacing.sm},
  row: {gap: spacing.md},
  fill: {flex: 1},
  headingRow: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between'},
  name: {color: colors.text, flex: 1, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  count: {color: colors.textMuted, fontWeight: '800'},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  pagination: {alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between'},
  page: {color: colors.text, fontWeight: '800'},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
