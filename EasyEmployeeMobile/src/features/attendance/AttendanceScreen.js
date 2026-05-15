import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {LogIn, LogOut, MapPin} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {verifyOfficeLocation} from '../../services/locationService';
import {
  checkIn,
  checkOut,
  clearAttendanceMessage,
  loadAttendance,
} from '../../store/attendanceSlice';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts, formatDisplayDate} from '../../utils/date';

const AttendanceItem = ({item}) => (
  <Card style={styles.item}>
    <View style={styles.itemHeader}>
      <View>
        <Text style={styles.itemTitle}>{formatDisplayDate(item)}</Text>
        <Text style={styles.itemSubtitle}>{item.day}</Text>
      </View>
      <StatusPill value={item.present ? 'Present' : 'Absent'} />
    </View>
    <View style={styles.grid}>
      <Text style={styles.meta}>In: {item.attendanceIn || '-'}</Text>
      <Text style={styles.meta}>Out: {item.attendanceOut || '-'}</Text>
      <Text style={styles.meta}>Late: {item.late || '-'}</Text>
      <Text style={styles.meta}>Hours: {item.totalHours || '-'}</Text>
    </View>
  </Card>
);

export const AttendanceScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);
  const {records, loading, actionLoading, error, message} = useSelector(
    state => state.attendance,
  );
  const [locationState, setLocationState] = useState(null);

  const todayRecord = useMemo(() => {
    const today = todayParts();
    return records.find(
      item =>
        item.date === today.date &&
        item.month === today.month &&
        item.year === today.year,
    );
  }, [records]);

  const monthlyCount = useMemo(
    () => records.filter(item => item.present).length,
    [records],
  );

  const refresh = useCallback(() => {
    if (user?.id) {
      dispatch(loadAttendance(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const handleCheckIn = async () => {
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
    <Screen scroll={false}>
      <Card>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>This month</Text>
          <Text style={styles.summaryValue}>{monthlyCount} present days</Text>
          <Text style={styles.summarySub}>
            Today: {todayRecord?.attendanceOut ? 'Completed' : todayRecord?.attendanceIn ? 'Checked in' : 'Not checked in'}
          </Text>
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
        <View style={styles.actions}>
          <AppButton
            disabled={Boolean(todayRecord?.attendanceIn)}
            icon={LogIn}
            loading={actionLoading}
            onPress={handleCheckIn}
            title={todayRecord?.attendanceIn ? 'Checked In' : 'Check In'}
            variant="success"
          />
          <AppButton
            disabled={!todayRecord?.attendanceIn || Boolean(todayRecord?.attendanceOut)}
            icon={LogOut}
            loading={actionLoading}
            onPress={handleCheckOut}
            title={todayRecord?.attendanceOut ? 'Checked Out' : 'Check Out'}
            variant="danger"
          />
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          renderItem={({item}) => <AttendanceItem item={item} />}
          ListEmptyComponent={
            <EmptyState
              title="No attendance yet"
              message="Your check-in history for this month will appear here."
            />
          }
          contentContainerStyle={styles.list}
        />
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
});
