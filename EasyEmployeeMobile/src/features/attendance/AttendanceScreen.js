import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {LogIn, LogOut, MapPin} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {FilterChips} from '../../components/FilterChips';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {getEmployeePayrollPolicies} from '../../api/employeeApi';
import {verifyOfficeLocation} from '../../services/locationService';
import {
  checkIn,
  checkOut,
  clearAttendanceMessage,
  loadAttendance,
} from '../../store/attendanceSlice';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {buildCycleDates, todayParts, formatDisplayDate} from '../../utils/date';

const AttendanceItem = ({item}) => (
  <Card style={styles.item}>
    <View style={styles.itemHeader}>
      <View>
        <Text style={styles.itemTitle}>{formatDisplayDate(item)}</Text>
        <Text style={styles.itemSubtitle}>{item.day}</Text>
      </View>
      <StatusPill value={item.displayStatus || item.status || (item.present ? 'Present' : 'Absent')} />
    </View>
    <View style={styles.grid}>
      <Text style={styles.meta}>In: {item.attendanceIn || '-'}</Text>
      <Text style={styles.meta}>Out: {item.attendanceOut || '-'}</Text>
      <Text style={styles.meta}>Late: {item.late || '-'}</Text>
      <Text style={styles.meta}>Hours: {item.totalHours || '-'}</Text>
      <Text style={styles.meta}>Status: {item.displayTimeStatus || item.timeStatus || item.displayStatus || item.status || '-'}</Text>
      <Text style={styles.meta}>Reason: {item.reason || '-'}</Text>
    </View>
  </Card>
);

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const splitRuleList = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
const masterRuleFromPolicies = policies =>
  (policies || []).find(
    item =>
      String(item.title || '').toLowerCase() === 'master salary rule' ||
      String(item.category || '').toLowerCase() === 'master salary rule',
  );
const weeklyOffDaysFromPolicies = policies => {
  const master = masterRuleFromPolicies(policies);
  const rule = (master?.rules || []).find(item =>
    ['weekly off days', 'weekly off'].includes(String(item.label || '').trim().toLowerCase()),
  );
  return splitRuleList(rule?.value || 'Sunday');
};
const ruleNumberFromPolicies = (policies, labels, fallback) => {
  const master = masterRuleFromPolicies(policies);
  const normalized = labels.map(item => item.toLowerCase());
  const rule = (master?.rules || []).find(item => normalized.includes(String(item.label || '').trim().toLowerCase()));
  const value = Number(String(rule?.value || '').match(/\d+/)?.[0]);
  return Number.isFinite(value) ? value : fallback;
};
const currentCycleStartParts = (policies, today) => {
  const startDay = ruleNumberFromPolicies(policies, ['Salary Cycle Start Day', 'Cycle Start Day'], 1);
  const endDay = ruleNumberFromPolicies(policies, ['Salary Cycle End Day', 'Cycle End Day'], 31);
  if (startDay > endDay && today.date <= endDay) {
    const previous = new Date(today.year, today.month - 2, 1);
    return {year: previous.getFullYear(), month: previous.getMonth() + 1};
  }
  return {year: today.year, month: today.month};
};

export const AttendanceScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);
  const {records, cycle, loading, actionLoading, error, message} = useSelector(
    state => state.attendance,
  );
  const [locationState, setLocationState] = useState(null);
  const [weeklyOffDays, setWeeklyOffDays] = useState(['sunday']);
  const currentParts = useMemo(() => todayParts(), []);
  const [filters, setFilters] = useState({
    mode: 'month',
    day: '',
    month: String(currentParts.month),
    year: String(currentParts.year),
  });

  const todayRecord = useMemo(() => {
    const today = todayParts();
    return records.find(
      item =>
        item.date === today.date &&
        item.month === today.month &&
        item.year === today.year,
    );
  }, [records]);

  const isWeeklyOffDate = useCallback(
    item => {
      const day = item?.day || dayNames[new Date(Number(item?.year), Number(item?.month) - 1, Number(item?.date)).getDay()];
      return weeklyOffDays.includes(String(day || '').toLowerCase());
    },
    [weeklyOffDays],
  );

  const displayRecords = useMemo(
    () => {
      const selectedMonth = Number(filters.month) || currentParts.month;
      const selectedYear = Number(filters.year) || currentParts.year;
      const cycleDates = buildCycleDates(cycle, selectedYear, selectedMonth, currentParts);
      const recordsByDate = new Map(records.map(item => [`${item.year}-${item.month}-${item.date}`, item]));

      return cycleDates.map(parts => {
        const {year, month, date} = parts;
        const day = dayNames[new Date(year, month - 1, date).getDay()];
        const item = recordsByDate.get(`${year}-${month}-${date}`) || {
          _id: `absent-${year}-${month}-${date}`,
          date,
          month,
          year,
          day,
          present: false,
          status: 'Absent',
          timeStatus: '-',
          attendanceIn: '-',
          attendanceOut: '-',
          late: '-',
          totalHours: '-',
          reason: 'Check-in not recorded',
        };

        return isWeeklyOffDate(item)
          ? {
              ...item,
              displayStatus: 'Weekly Off',
              displayTimeStatus: 'Weekly Off',
              reason: item.reason || `${item.day || 'Day'} weekly off by master salary rule`,
            }
          : item;
      });
    },
    [currentParts, cycle, filters.month, filters.year, isWeeklyOffDate, records],
  );

  const visibleRecords = useMemo(() => {
    const filtered = displayRecords.filter(item => {
      if (filters.mode === 'day' && filters.day) {
        return String(item.date) === String(filters.day);
      }
      return true;
    });
    return [...filtered].sort((a, b) => new Date(b.year, b.month - 1, b.date) - new Date(a.year, a.month - 1, a.date));
  }, [displayRecords, filters.day, filters.mode]);

  const monthlyCount = useMemo(
    () => displayRecords.filter(item => item.present && !isWeeklyOffDate(item) && String(item.status || '').toLowerCase() !== 'weekly off').length,
    [displayRecords, isWeeklyOffDate],
  );
  const weeklyOffMonthCount = useMemo(() => {
    return displayRecords.filter(isWeeklyOffDate).length;
  }, [displayRecords, isWeeklyOffDate]);
  const todayDayName = dayNames[new Date(currentParts.year, currentParts.month - 1, currentParts.date).getDay()];
  const isWeeklyOffToday = weeklyOffDays.includes(todayDayName.toLowerCase());

  const refresh = useCallback(() => {
    if (user?.id) {
      dispatch(loadAttendance({
        employeeID: user.id,
        month: Number(filters.month) || currentParts.month,
        year: Number(filters.year) || currentParts.year,
      }));
    }
  }, [currentParts.month, currentParts.year, dispatch, filters.month, filters.year, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    const loadPolicies = async () => {
      try {
        const response = await getEmployeePayrollPolicies();
        if (mounted) {
          const policies = response?.data || [];
          setWeeklyOffDays(weeklyOffDaysFromPolicies(policies));
          const cycleStart = currentCycleStartParts(policies, currentParts);
          setFilters(current => ({
            ...current,
            month: String(cycleStart.month),
            year: String(cycleStart.year),
          }));
        }
      } catch (err) {
        if (mounted) setWeeklyOffDays(['sunday']);
      }
    };
    loadPolicies();
    return () => {
      mounted = false;
    };
  }, [currentParts]);

  useEffect(() => {
    let mounted = true;
    const checkLocation = async () => {
      const result = await verifyOfficeLocation(user?.workType);
      if (mounted) {
        setLocationState(result);
      }
    };
    checkLocation();
    return () => {
      mounted = false;
    };
  }, [user?.workType]);

  useEffect(() => {
    if (error || message) {
      Alert.alert(error ? 'Attendance' : 'Success', error || message, [
        {text: 'OK', onPress: () => dispatch(clearAttendanceMessage())},
      ]);
    }
  }, [dispatch, error, message]);

  const runLocationGate = async () => {
    const result = await verifyOfficeLocation(user?.workType);
    setLocationState(result);
    if (!result.allowed) {
      Alert.alert('Office location required', result.message);
    }
    return result;
  };

  const isCurrentMonthFilter =
    Number(filters.month) === currentParts.month &&
    Number(filters.year) === currentParts.year;
  const canCheckIn = Boolean(locationState?.allowed) && isCurrentMonthFilter && !isWeeklyOffToday && !todayRecord?.attendanceIn;
  const canCheckOut = isCurrentMonthFilter && !isWeeklyOffToday && Boolean(todayRecord?.attendanceIn) && !todayRecord?.attendanceOut;

  const handleCheckIn = async () => {
    if (isWeeklyOffToday) {
      Alert.alert('Weekly off', `${todayDayName} is weekly off as per company rule.`);
      return;
    }
    const locationResult = await runLocationGate();
    if (!locationResult.allowed) {
      return;
    }
    await dispatch(
      checkIn({
        employeeID: user.id,
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        accuracy: locationResult.accuracy,
        source: 'mobile',
      }),
    );
    refresh();
  };

  const handleCheckOut = async () => {
    if (isWeeklyOffToday) {
      Alert.alert('Weekly off', `${todayDayName} is weekly off as per company rule.`);
      return;
    }
    const locationResult = await runLocationGate();
    if (!locationResult.allowed) {
      return;
    }
    await dispatch(
      checkOut({
        employeeID: user.id,
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        accuracy: locationResult.accuracy,
        source: 'mobile',
      }),
    );
    refresh();
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
      <PageHeader
        eyebrow="Attendance"
        title="Daily Check-in"
        subtitle="GPS check-in, checkout, weekly offs, and cycle attendance history."
      />
      <Card>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>This salary cycle</Text>
          <Text style={styles.summaryValue}>{monthlyCount} present days</Text>
          <Text style={styles.summarySub}>
            Today: {isWeeklyOffToday ? 'Weekly off' : todayRecord?.attendanceOut ? 'Completed' : todayRecord?.attendanceIn ? 'Checked in' : 'Not checked in'}
          </Text>
          <Text style={styles.summarySub}>{weeklyOffMonthCount} weekly off day(s)</Text>
          {isWeeklyOffToday ? <Text style={styles.summarySub}>{todayDayName} weekly off as per master salary rule</Text> : null}
        </View>
      </Card>

      <Card>
        <View style={styles.locationRow}>
          <MapPin color={colors.info} size={20} />
          <Text style={styles.locationText}>
            {locationState?.distanceMeters != null
              ? `${Math.round(locationState.distanceMeters)}m from office`
              : user?.workType === 'Onsite'
                ? 'Precise office GPS verification required'
                : 'Location unrestricted for this work type'}
          </Text>
        </View>
        {locationState?.message ? <Text style={styles.locationHint}>{locationState.message}</Text> : null}
        <View style={styles.actions}>
          <AppButton
            icon={MapPin}
            loading={actionLoading}
            onPress={runLocationGate}
            title="Refresh Location"
            variant="muted"
          />
          <AppButton
            disabled={!canCheckIn}
            icon={LogIn}
            loading={actionLoading}
            onPress={handleCheckIn}
            title={isWeeklyOffToday ? 'Weekly Off' : todayRecord?.attendanceIn ? 'Checked In' : 'Check In'}
            variant="success"
          />
          <AppButton
            disabled={!canCheckOut}
            icon={LogOut}
            loading={actionLoading}
            onPress={handleCheckOut}
            title={isWeeklyOffToday ? 'Weekly Off' : todayRecord?.attendanceOut ? 'Checked Out' : 'Check Out'}
            variant="danger"
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.filterTitle}>Attendance Filter</Text>
        <FilterChips
          items={[
            {label: 'By month', value: 'month'},
            {label: 'By day', value: 'day'},
          ]}
          value={filters.mode}
          onChange={mode => setFilters(current => ({...current, mode}))}
        />
        <View style={styles.filterGrid}>
          {filters.mode === 'day' ? (
            <AppTextInput
              keyboardType="numeric"
              label="Day"
              placeholder="1-31"
              value={filters.day}
              onChangeText={day => setFilters(current => ({...current, day: day.replace(/[^0-9]/g, '')}))}
              style={styles.filterInput}
            />
          ) : null}
          <AppTextInput
            keyboardType="numeric"
            label="Month"
            placeholder="1-12"
            value={filters.month}
            onChangeText={month => setFilters(current => ({...current, month: month.replace(/[^0-9]/g, '')}))}
            style={styles.filterInput}
          />
          <AppTextInput
            keyboardType="numeric"
            label="Year"
            placeholder="2026"
            value={filters.year}
            onChangeText={year => setFilters(current => ({...current, year: year.replace(/[^0-9]/g, '')}))}
            style={styles.filterInput}
          />
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.list}>
          {visibleRecords.map(item => <AttendanceItem key={item._id || `${item.year}-${item.month}-${item.date}`} item={item} />)}
          {!visibleRecords.length ? (
            <EmptyState
              title="No attendance yet"
              message="Your check-in history for this month will appear here."
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  summary: {
    gap: spacing.xs,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  summarySub: {
    color: colors.textMuted,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationText: {
    color: colors.text,
    flex: 1,
  },
  locationHint: {
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  item: {
    marginBottom: spacing.md,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  itemSubtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  grid: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  meta: {
    color: colors.textMuted,
    minWidth: '45%',
  },
  filterTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  filterInput: {
    flexBasis: '30%',
    flexGrow: 1,
  },
});
