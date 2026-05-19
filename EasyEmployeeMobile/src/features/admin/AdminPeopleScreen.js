import React, {useEffect, useMemo, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Edit3, Eye, Power, Trash2} from 'lucide-react-native';
import {
  deleteAdminUser,
  getAdminAllUsers,
  updateAdminUser,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {PageHeader} from '../../components/PageHeader';
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

const InfoPill = ({label, value}) => (
  <View style={styles.infoPill}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

export const AdminPeopleScreen = ({navigation}) => {
  const [items, setItems] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [expandedId, setExpandedId] = useState('');
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

      <PageHeader
        eyebrow="People operations"
        title="Employees"
        subtitle="Clean employee, leader, bank, tax, team, and employment records in one structured view."
      />

      <Card>
        <Text style={styles.title}>Directory Filters</Text>
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
            <View style={styles.infoGrid}>
              <InfoPill label="Role" value={item.type} />
              <InfoPill label="Employee ID" value={item.username} />
              <InfoPill label="Code" value={item.employeeCode} />
              <InfoPill label="Mobile" value={item.mobile} />
            </View>
            <Text style={styles.meta}>Email: {item.email || '-'}</Text>
            {expandedId === (item.id || item._id) ? (
              <View style={styles.detailPanel}>
                <View style={styles.infoGrid}>
                  <InfoPill label="Department" value={item.department} />
                  <InfoPill label="Designation" value={item.designation} />
                  <InfoPill label="Work Type" value={item.workType} />
                  <InfoPill label="Joining" value={item.date} />
                  <InfoPill label="Team" value={item.team?.name} />
                  <InfoPill label="PAN" value={item.panNumber} />
                  <InfoPill label="Aadhaar" value={item.aadhaarNumber} />
                  <InfoPill label="Bank" value={item.bankName} />
                  <InfoPill label="Account" value={item.accountNumber} />
                  <InfoPill label="IFSC" value={item.ifscCode} />
                  <InfoPill label="UAN" value={item.uan} />
                  <InfoPill label="ESI" value={item.esi} />
                </View>
                <Text style={styles.meta}>Address: {item.address || '-'}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.actions}>
            <AppButton
              icon={Eye}
              title={expandedId === (item.id || item._id) ? 'Hide Details' : 'Details'}
              variant="muted"
              onPress={() => setExpandedId(current => current === (item.id || item._id) ? '' : (item.id || item._id))}
            />
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
  infoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs},
  infoPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.sm,
  },
  infoLabel: {color: colors.textMuted, fontSize: 11, fontWeight: '900'},
  infoValue: {color: colors.text, fontSize: 13, fontWeight: '900', marginTop: spacing.xs},
  detailPanel: {backgroundColor: colors.surfaceMuted, borderRadius: 8, marginTop: spacing.sm, padding: spacing.sm},
  count: {color: colors.textMuted, fontWeight: '800'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  roleTabs: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
