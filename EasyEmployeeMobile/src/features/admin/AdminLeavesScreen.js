import React, {useEffect, useState} from 'react';
import {Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Check, X} from 'lucide-react-native';
import {getAdminLeaves, updateAdminLeave} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const filters = [
  {label: 'All', value: ''},
  {label: 'Pending', value: 'Pending'},
  {label: 'Approved', value: 'Approved'},
  {label: 'Rejected', value: 'Rejected'},
];

export const AdminLeavesScreen = ({route}) => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(route?.params?.employeeID ? '' : '');
  const [rejecting, setRejecting] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getAdminLeaves(status ? {adminResponse: status} : {});
      const list = response?.data || response?.applications || [];
      const employeeID = route?.params?.employeeID ? String(route.params.employeeID) : '';
      setItems(employeeID ? list.filter(item => String(item.applicantID) === employeeID) : list);
    } catch (err) {
      setToast(err.message || 'Leave applications could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [route?.params?.employeeID, status]);

  const approve = async item => {
    try {
      await updateAdminLeave(item.id || item._id, {adminResponse: 'Approved', rejectionReason: ''});
      setToast('Leave approved.');
      load();
    } catch (err) {
      setToast(err.message || 'Leave could not be approved.');
    }
  };

  const reject = async item => {
    if (!reason.trim()) {
      setToast('Rejection message is required.');
      return;
    }
    try {
      await updateAdminLeave(item.id || item._id, {adminResponse: 'Rejected', rejectionReason: reason.trim()});
      setToast('Leave rejected with message.');
      setRejecting('');
      setReason('');
      load();
    } catch (err) {
      setToast(err.message || 'Leave could not be rejected.');
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View style={styles.filterRow}>
        {filters.map(item => {
          const active = status === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setStatus(item.value)}
              style={[styles.filterButton, active ? styles.filterActive : styles.filterInactive]}>
              <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ToastBanner message={toast} type={toast.includes('approved') || toast.includes('rejected') ? 'success' : 'error'} onHide={() => setToast('')} />
      {items.map(item => {
        const id = item.id || item._id;
        return (
          <Card key={id}>
            <View style={styles.heading}>
              <Text style={styles.title}>{item.applicantName || item.employee?.name || item.user?.name || 'Leave request'}</Text>
              <StatusPill value={item.adminResponse || 'Pending'} />
            </View>
            <Text style={styles.meta}>{item.applicantEmail || '-'}</Text>
            <Text style={styles.meta}>Status: {item.adminResponse || 'Pending'}</Text>
            <Text style={styles.meta}>Type: {item.type || item.leaveType || '-'}</Text>
            <Text style={styles.meta}>From: {item.from || item.startDate || '-'}</Text>
            <Text style={styles.meta}>To: {item.to || item.endDate || '-'}</Text>
            <Text style={styles.meta}>Days: {item.period || '-'}</Text>
            <Text style={styles.meta}>Reason: {item.reason || '-'}</Text>
            {item.rejectionReason ? <Text style={styles.rejectText}>Rejection message: {item.rejectionReason}</Text> : null}
            {rejecting === id ? (
              <View style={styles.rejectBox}>
                <AppTextInput label="Rejection message visible to employee" value={reason} onChangeText={setReason} multiline />
                <AppButton icon={X} onPress={() => reject(item)} title="Confirm Reject" variant="danger" />
              </View>
            ) : null}
            <View style={styles.actions}>
              <AppButton icon={Check} onPress={() => approve(item)} title="Approve" variant="success" />
              <AppButton icon={X} onPress={() => setRejecting(id)} title="Reject" variant="danger" />
            </View>
          </Card>
        );
      })}
      {!loading && !items.length ? <Text style={styles.empty}>No leave applications found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  heading: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between'},
  title: {color: colors.text, flex: 1, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  filterButton: {alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 40, justifyContent: 'center', minWidth: 86, paddingHorizontal: spacing.sm},
  filterActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  filterInactive: {backgroundColor: colors.surfaceMuted, borderColor: colors.border},
  filterText: {fontSize: 13, fontWeight: '900'},
  filterTextActive: {color: colors.surface},
  filterTextInactive: {color: colors.text},
  rejectText: {color: colors.danger, fontWeight: '800', marginTop: spacing.sm},
  rejectBox: {gap: spacing.sm, marginTop: spacing.md},
  actions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.md},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
