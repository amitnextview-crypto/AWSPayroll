import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {CalendarPlus} from 'lucide-react-native';
import {applyLeave, getLeaveApplications} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatApiDate} from '../../utils/date';

const initialForm = {
  title: '',
  type: '',
  period: '',
  startDate: '',
  endDate: '',
  reason: '',
};

const LeaveItem = ({item}) => (
  <Card style={styles.leaveItem}>
    <View style={styles.leaveHeader}>
      <View style={styles.leaveTitleWrap}>
        <Text style={styles.leaveTitle}>{item.title}</Text>
        <Text style={styles.leaveMeta}>{item.type}</Text>
      </View>
      <StatusPill value={item.adminResponse} />
    </View>
    <Text style={styles.leaveMeta}>Applied: {item.appliedDate}</Text>
    <Text style={styles.leaveMeta}>Dates: {item.startDate} to {item.endDate}</Text>
    <Text style={styles.leaveMeta}>Period: {item.period} day(s)</Text>
  </Card>
);

export const LeaveScreen = () => {
  const {user} = useSelector(state => state.auth);
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => setForm(current => ({...current, [key]: value}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getLeaveApplications({applicantID: user.id});
      setItems(response?.data || []);
    } catch (error) {
      Alert.alert('Leave history', error.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const required = ['title', 'type', 'period', 'startDate', 'endDate', 'reason'];
    if (required.some(key => !String(form[key]).trim())) {
      Alert.alert('Apply leave', 'Please complete all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await applyLeave({
        ...form,
        period: Number(form.period),
        applicantID: user.id,
        appliedDate: formatApiDate(),
      });
      if (!response?.success) {
        throw new Error(response?.message || 'Unable to apply leave.');
      }
      setForm(initialForm);
      Alert.alert('Leave applied', 'Your leave request has been sent to admin.');
      load();
    } catch (error) {
      Alert.alert('Apply leave', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.sectionTitle}>Apply Leave</Text>
        <View style={styles.form}>
          <AppTextInput label="Title" onChangeText={value => update('title', value)} value={form.title} />
          <AppTextInput label="Type" onChangeText={value => update('type', value)} placeholder="Sick Leave, Casual Leave" value={form.type} />
          <AppTextInput keyboardType="numeric" label="Period" onChangeText={value => update('period', value)} value={form.period} />
          <AppTextInput label="Start date" onChangeText={value => update('startDate', value)} placeholder="YYYY-MM-DD" value={form.startDate} />
          <AppTextInput label="End date" onChangeText={value => update('endDate', value)} placeholder="YYYY-MM-DD" value={form.endDate} />
          <AppTextInput label="Reason" multiline onChangeText={value => update('reason', value)} value={form.reason} />
          <AppButton icon={CalendarPlus} loading={submitting} onPress={submit} title="Apply Leave" />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Leave History</Text>
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({item}) => <LeaveItem item={item} />}
        ListEmptyComponent={
          <EmptyState title="No leave applications" message="Approved, pending, and rejected leave requests will appear here." />
        }
        scrollEnabled={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  leaveItem: {
    marginBottom: spacing.md,
  },
  leaveHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  leaveTitleWrap: {
    flex: 1,
  },
  leaveTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  leaveMeta: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
