import React, {useEffect, useMemo, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {getAdminAllUsers, getAdminAttendance, getAdminLeaves} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {StatusPill} from '../../components/StatusPill';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts} from '../../utils/date';

const idOf = item => String(item?.id || item?._id || item || '');
const isWorkforce = user => ['employee', 'leader'].includes(String(user?.type || '').toLowerCase());
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const apiDate = (year, month, date) =>
  `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

const displayDate = (year, month, date) =>
  `${String(date).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

const daysForMonth = (year, month, today) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  if (year === today.year && month === today.month) return today.date;
  const selected = new Date(year, month - 1, 1);
  const current = new Date(today.year, today.month - 1, 1);
  return selected > current ? 0 : daysInMonth;
};

const statusForMissing = (leaves, year, month, date) => {
  const target = apiDate(year, month, date);
  const leave = leaves.find(item => item.startDate <= target && item.endDate >= target);
  if (!leave) return 'Check-in not recorded';
  const status = leave.adminResponse || 'Pending';
  if (status === 'Approved') return `Approved Leave - ${leave.type || 'Leave'}`;
  if (status === 'Rejected') return `Leave Rejected - ${leave.type || 'Leave'}`;
  return `Leave Pending - ${leave.type || 'Leave'}`;
};

export const AdminAttendanceScreen = () => {
  const today = useMemo(() => todayParts(), []);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(String(today.month));
  const [yearFilter, setYearFilter] = useState(String(today.year));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedEmployee = employees.find(employee => idOf(employee) === selectedEmployeeId);
  const month = Math.min(Math.max(Number(monthFilter || today.month), 1), 12);
  const year = Number(yearFilter || today.year);

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminAllUsers();
      const workforce = (response?.data || []).filter(isWorkforce);
      setEmployees(workforce);
      if (!selectedEmployeeId && workforce[0]) setSelectedEmployeeId(idOf(workforce[0]));
    } catch (err) {
      setError(err.message || 'Employees could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    setError('');
    try {
      const [attendanceResponse, leavesResponse] = await Promise.all([
        getAdminAttendance({employeeID: selectedEmployeeId, month, year}),
        getAdminLeaves({applicantID: selectedEmployeeId}),
      ]);
      setRecords(attendanceResponse?.data || []);
      setLeaves(leavesResponse?.data || []);
    } catch (err) {
      setError(err.message || 'Attendance could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedEmployeeId, monthFilter, yearFilter]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(employee =>
      `${employee.name || ''} ${employee.email || ''} ${employee.username || ''} ${employee.employeeCode || ''} ${idOf(employee)}`
        .toLowerCase()
        .includes(term),
    );
  }, [employees, search]);

  const attendanceRows = useMemo(() => {
    if (!selectedEmployee) return [];
    const recordByDate = new Map(records.map(item => [Number(item.date), item]));
    const count = daysForMonth(year, month, today);
    const rows = [];
    for (let date = 1; date <= count; date += 1) {
      const record = recordByDate.get(date);
      const day = dayNames[new Date(year, month - 1, date).getDay()];
      const status = record?.status || (record ? (record.present ? 'Present' : 'Absent') : statusForMissing(leaves, year, month, date));
      rows.push({
        key: `${year}-${month}-${date}`,
        name: selectedEmployee.name || selectedEmployee.username || '-',
        email: selectedEmployee.email || '-',
        date,
        day: record?.day || day,
        status,
        attendanceIn: record?.attendanceIn || '-',
        attendanceOut: record?.attendanceOut || '-',
        late: record?.late || '-',
        totalHours: record?.totalHours || '-',
        timeStatus: record?.timeStatus || (status === 'Present' ? 'Full Time' : '-'),
      });
    }
    const selectedDate = Number(dateFilter || 0);
    return selectedDate ? rows.filter(row => row.date === selectedDate) : rows;
  }, [dateFilter, leaves, month, records, selectedEmployee, today, year]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { loadEmployees(); loadAttendance(); }} />}>
      <Card>
        <Text style={styles.title}>Attendance</Text>
        <AppTextInput label="Search employee by name, email, ID, code, or letter" value={search} onChangeText={setSearch} />
        <View style={styles.twoCol}>
          <AppTextInput label="Month" keyboardType="numeric" value={monthFilter} onChangeText={value => setMonthFilter(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
          <AppTextInput label="Year" keyboardType="numeric" value={yearFilter} onChangeText={value => setYearFilter(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
        </View>
        <AppTextInput label="Filter by date number" keyboardType="numeric" value={dateFilter} onChangeText={value => setDateFilter(value.replace(/[^0-9]/g, ''))} />
        <Text style={styles.meta}>Employees and leaders: {employees.length}</Text>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Text style={styles.section}>Select Employee</Text>
        {filteredEmployees.map(employee => {
          const active = idOf(employee) === selectedEmployeeId;
          return (
            <View key={idOf(employee)} style={styles.employeeRow}>
              <View style={styles.flex}>
                <Text style={styles.name}>{employee.name || employee.username || '-'}</Text>
                <Text style={styles.meta}>{employee.email || '-'} / {employee.username || '-'}</Text>
              </View>
              <AppButton title={active ? 'Selected' : 'Select'} variant={active ? 'primary' : 'muted'} onPress={() => setSelectedEmployeeId(idOf(employee))} />
            </View>
          );
        })}
        {!filteredEmployees.length ? <Text style={styles.empty}>No employees found.</Text> : null}
      </Card>

      {selectedEmployee ? (
        <Card>
          <Text style={styles.title}>{selectedEmployee.name || selectedEmployee.username || '-'}</Text>
          <Text style={styles.meta}>Email: {selectedEmployee.email || '-'}</Text>
          <Text style={styles.meta}>Employee ID: {selectedEmployee.username || '-'}</Text>
          <Text style={styles.meta}>Month records: {attendanceRows.length}</Text>
        </Card>
      ) : null}

      {attendanceRows.map(row => (
        <Card key={row.key}>
          <View style={styles.heading}>
            <Text style={styles.name}>{row.name}</Text>
            <StatusPill value={row.status} />
          </View>
          <Text style={styles.meta}>Name: {row.name}</Text>
          <Text style={styles.meta}>Email: {row.email}</Text>
          <Text style={styles.meta}>Date: {displayDate(year, month, row.date)}</Text>
          <Text style={styles.meta}>Day: {row.day}</Text>
          <Text style={styles.meta}>Status: {row.status}</Text>
          <Text style={styles.meta}>In Time: {row.attendanceIn}</Text>
          <Text style={styles.meta}>Out Time: {row.attendanceOut}</Text>
          <Text style={styles.meta}>Late: {row.late}</Text>
          <Text style={styles.meta}>Total Hours: {row.totalHours}</Text>
          <Text style={styles.meta}>Time Status: {row.timeStatus}</Text>
        </Card>
      ))}

      {!loading && selectedEmployee && !attendanceRows.length ? <Text style={styles.empty}>No attendance days found for this filter.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: spacing.sm},
  section: {color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: spacing.sm},
  heading: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between'},
  name: {color: colors.text, flex: 1, fontSize: 16, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  twoCol: {flexDirection: 'row', gap: spacing.md},
  flex: {flex: 1},
  employeeRow: {alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
