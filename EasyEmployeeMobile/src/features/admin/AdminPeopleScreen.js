import React, {useEffect, useMemo, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Power, Trash2} from 'lucide-react-native';
import {
  deleteAdminUser,
  getAdminAllUsers,
  updateAdminUser,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const roleOptions = [
  {label: 'All', value: ''},
  {label: 'Employee', value: 'employee'},
  {label: 'Leader', value: 'leader'},
];

const roleOf = user => String(user?.type || '').toLowerCase();
const isWorkforce = user => ['employee', 'leader'].includes(roleOf(user));

export const AdminPeopleScreen = ({navigation}) => {
  const [items, setItems] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getAdminAllUsers();
      setItems((response?.data || []).filter(isWorkforce));
    } catch (err) {
      setToast(err.message || 'Employees could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item =>
      (!roleFilter || roleOf(item) === roleFilter) &&
      (!term ||
        `${item.name || ''} ${item.email || ''} ${item.username || ''} ${item.employeeCode || ''} ${item.id || item._id || ''}`
          .toLowerCase()
          .includes(term)),
    );
  }, [items, roleFilter, search]);

  const confirmDelete = user => {
    Alert.alert('Delete employee', `Delete ${user?.name || 'this employee'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminUser(user.id || user._id);
            setToast('Employee deleted successfully.');
            load();
          } catch (err) {
            setToast(err.message || 'Employee could not be deleted.');
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
      setToast(isActive ? 'Employee deactivated.' : 'Employee activated.');
      load();
    } catch (err) {
      setToast(err.message || 'Status could not be updated.');
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') || toast.includes('activated') ? 'success' : 'error'} onHide={() => setToast('')} />

      <Card>
        <Text style={styles.title}>Employees</Text>
        <View style={styles.roleTabs}>
          {roleOptions.map(option => (
            <AppButton
              key={option.value}
              title={option.label}
              variant={roleFilter === option.value ? 'primary' : 'muted'}
              onPress={() => setRoleFilter(option.value)}
            />
          ))}
        </View>
        <AppTextInput label="Search by name, email, ID, code, or letter" value={searchDraft} onChangeText={setSearchDraft} />
        <View style={styles.actions}>
          <AppButton title="Apply Filter" loading={loading} onPress={() => setSearch(searchDraft)} />
          <AppButton title="Clear" variant="muted" onPress={() => { setSearchDraft(''); setSearch(''); }} />
        </View>
      </Card>

      <Text style={styles.count}>{visibleItems.length} records</Text>
      {visibleItems.map(item => (
        <Card key={item.id || item._id}>
          <View style={styles.headingRow}>
            <Text style={styles.name}>{item.name || item.username || '-'}</Text>
            <StatusPill value={item.status || '-'} />
          </View>
          <View style={styles.details}>
            <Text style={styles.meta}>Role: {item.type || '-'}</Text>
            <Text style={styles.meta}>Email: {item.email || '-'}</Text>
            <Text style={styles.meta}>Mobile: {item.mobile || '-'}</Text>
            <Text style={styles.meta}>Employee ID: {item.username || '-'}</Text>
            <Text style={styles.meta}>Code: {item.employeeCode || '-'}</Text>
            <Text style={styles.meta}>Department: {item.department || '-'}</Text>
            <Text style={styles.meta}>Designation: {item.designation || '-'}</Text>
            <Text style={styles.meta}>Work Type: {item.workType || '-'}</Text>
            <Text style={styles.meta}>Joining: {item.date || '-'}</Text>
            <Text style={styles.meta}>Team: {item.team?.name || '-'}</Text>
            <Text style={styles.meta}>PAN: {item.panNumber || '-'}</Text>
            <Text style={styles.meta}>Aadhaar: {item.aadhaarNumber || '-'}</Text>
            <Text style={styles.meta}>Bank: {item.bankName || '-'}</Text>
            <Text style={styles.meta}>Account: {item.accountNumber || '-'}</Text>
            <Text style={styles.meta}>IFSC: {item.ifscCode || '-'}</Text>
            <Text style={styles.meta}>UAN: {item.uan || '-'}</Text>
            <Text style={styles.meta}>ESI: {item.esi || '-'}</Text>
            <Text style={styles.meta}>Address: {item.address || '-'}</Text>
          </View>
          <View style={styles.actions}>
            <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => navigation.navigate('AdminAddUser', {user: item})} />
            <AppButton icon={Power} title={String(item.status).toLowerCase() === 'active' ? 'Deactivate' : 'Activate'} variant="muted" onPress={() => toggleStatus(item)} />
            <AppButton icon={Trash2} onPress={() => confirmDelete(item)} title="Delete" variant="danger" />
          </View>
        </Card>
      ))}

      {!loading && !visibleItems.length ? <Text style={styles.empty}>No employees found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.sm},
  headingRow: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between'},
  name: {color: colors.text, flex: 1, fontSize: 18, fontWeight: '900'},
  meta: {color: colors.textMuted, lineHeight: 20},
  details: {gap: spacing.xs, marginTop: spacing.sm},
  count: {color: colors.textMuted, fontWeight: '800'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  roleTabs: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
