import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {CalendarPlus, ChevronLeft, ChevronRight} from 'lucide-react-native';
import {applyLeave, getEmployeePayrollPolicies, getLeaveApplications} from '../../api/employeeApi';
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

const leaveWords = ['leave', 'sick', 'casual', 'earned', 'paid', 'unpaid', 'maternity', 'paternity'];

const extractLeaveTypes = policies => {
  const values = new Set();
  policies.forEach(policy => {
    const text = `${policy.title || ''} ${policy.category || ''}`.toLowerCase();
    if (leaveWords.some(word => text.includes(word))) {
      if (policy.title) values.add(policy.title);
    }
    (policy.rules || []).forEach(rule => {
      const ruleText = `${rule.label || ''} ${rule.value || ''}`.toLowerCase();
      if (leaveWords.some(word => ruleText.includes(word))) {
        if (rule.label) values.add(rule.label);
      }
    });
  });
  return Array.from(values);
};

const CalendarPicker = ({visible, value, onClose, onSelect}) => {
  const base = value ? new Date(value) : new Date();
  const [cursor, setCursor] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [
    ...Array.from({length: firstDay}, () => null),
    ...Array.from({length: daysInMonth}, (_, index) => index + 1),
  ];
  const monthLabel = cursor.toLocaleString('en-IN', {month: 'long', year: 'numeric'});

  const move = direction => setCursor(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable style={styles.iconButton} onPress={() => move(-1)}>
              <ChevronLeft color={colors.text} size={20} />
            </Pressable>
            <Text style={styles.calendarTitle}>{monthLabel}</Text>
            <Pressable style={styles.iconButton} onPress={() => move(1)}>
              <ChevronRight color={colors.text} size={20} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {cells.map((day, index) => {
              const date = day ? formatApiDate(new Date(year, month, day)) : '';
              const selected = date === value;
              return (
                <Pressable
                  key={`${day || 'blank'}-${index}`}
                  disabled={!day}
                  onPress={() => {
                    onSelect(date);
                    onClose();
                  }}
                  style={[styles.dayCell, selected && styles.selectedDay]}>
                  <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day || ''}</Text>
                </Pressable>
              );
            })}
          </View>
          <AppButton title="Close" variant="muted" onPress={onClose} />
        </Card>
      </View>
    </Modal>
  );
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
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showTypes, setShowTypes] = useState(false);
  const [dateField, setDateField] = useState('');
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

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const response = await getEmployeePayrollPolicies();
        const types = extractLeaveTypes(response?.data || []);
        setLeaveTypes(types.length ? types : ['Sick Leave', 'Casual Leave', 'Earned Leave']);
      } catch (error) {
        setLeaveTypes(['Sick Leave', 'Casual Leave', 'Earned Leave']);
      }
    };
    loadTypes();
  }, []);

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
          <View>
            <Text style={styles.inputLabel}>Type</Text>
            <Pressable style={styles.selectBox} onPress={() => setShowTypes(current => !current)}>
              <Text style={[styles.selectText, !form.type && styles.placeholder]}>{form.type || 'Select leave type'}</Text>
            </Pressable>
            {showTypes ? (
              <View style={styles.dropdown}>
                {leaveTypes.map(type => (
                  <Pressable key={type} style={styles.option} onPress={() => {
                    update('type', type);
                    setShowTypes(false);
                  }}>
                    <Text style={styles.optionText}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <AppTextInput keyboardType="numeric" label="Period" placeholder="Enter number of days" onChangeText={value => update('period', value.replace(/[^0-9]/g, ''))} value={form.period} />
          <Pressable onPress={() => setDateField('startDate')}>
            <AppTextInput editable={false} label="Start date" placeholder="Select start date" value={form.startDate} />
          </Pressable>
          <Pressable onPress={() => setDateField('endDate')}>
            <AppTextInput editable={false} label="End date" placeholder="Select end date" value={form.endDate} />
          </Pressable>
          <AppTextInput label="Reason" multiline placeholder="Write reason for leave" onChangeText={value => update('reason', value)} value={form.reason} />
          <AppButton icon={CalendarPlus} loading={submitting} onPress={submit} title="Apply Leave" />
        </View>
      </Card>
      <CalendarPicker
        visible={Boolean(dateField)}
        value={dateField ? form[dateField] : ''}
        onClose={() => setDateField('')}
        onSelect={date => update(dateField, date)}
      />

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
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  selectBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  selectText: {color: colors.text},
  placeholder: {color: colors.textMuted},
  dropdown: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  option: {padding: spacing.md},
  optionText: {color: colors.text, fontWeight: '800'},
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  calendarCard: {width: '100%'},
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarTitle: {color: colors.text, fontSize: 17, fontWeight: '900'},
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  weekRow: {flexDirection: 'row'},
  weekDay: {color: colors.textMuted, flex: 1, fontWeight: '900', textAlign: 'center'},
  calendarGrid: {flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.md},
  dayCell: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  selectedDay: {backgroundColor: colors.primary, borderRadius: 8},
  dayText: {color: colors.text, fontWeight: '800'},
  selectedDayText: {color: colors.surface},
});
