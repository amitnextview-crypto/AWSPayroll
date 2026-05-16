import React, {useEffect, useMemo, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Check, Edit3, Trash2, X} from 'lucide-react-native';
import {
  deleteAdminAttendance,
  getAdminAllUsers,
  getAdminAttendance,
  getAdminLeaves,
  updateAdminAttendance,
} from '../../api/employeeApi';
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

const emptyEdit = {status: 'Absent', attendanceIn: '', attendanceOut: '', late: 'No', timeStatus: ''};

export const AdminAttendanceScreen = ({route}) => {
  const today = useMemo(() => todayParts(), []);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(route?.params?.date ? String(route.params.date) : '');
  const [monthFilter, setMonthFilter] = useState(String(today.month));
  const [yearFilter, setYearFilter] = useState(String(today.year));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState('');
  const [editForm, setEditForm] = useState(emptyEdit);

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
      const routeEmployeeId = route?.params?.employeeID ? String(route.params.employeeID) : '';
      if (routeEmployeeId) setSelectedEmployeeId(routeEmployeeId);
      else if (!selectedEmployeeId && workforce[0]) setSelectedEmployeeId(idOf(workforce[0]));
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
  }, [route?.params?.employeeID]);

  useEffect(() => {
    if (route?.params?.date) setDateFilter(String(route.params.date));
  }, [route?.params?.date]);

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
        id: record?._id || record?.id || '',
        employeeID: selectedEmployeeId,
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
    const visibleRows = selectedDate ? rows.filter(row => row.date === selectedDate) : rows;
    return visibleRows.sort((a, b) => b.date - a.date);
  }, [dateFilter, leaves, month, records, selectedEmployee, today, year]);

  const startEdit = row => {
    setEditingKey(row.key);
    setEditForm({
      status: ['Present', 'Half Day', 'Leave', 'Absent'].includes(row.status) ? row.status : 'Absent',
      attendanceIn: row.attendanceIn === '-' ? '' : row.attendanceIn,
      attendanceOut: row.attendanceOut === '-' ? '' : row.attendanceOut,
      late: row.late === '-' ? 'No' : row.late,
      timeStatus: row.timeStatus === '-' ? '' : row.timeStatus,
    });
  };

  const setEdit = (key, value) => setEditForm(current => ({...current, [key]: value}));

  const saveAttendance = async row => {
    setLoading(true);
    setError('');
    try {
      const present = editForm.status === 'Present' || editForm.status === 'Half Day';
      await updateAdminAttendance({
        id: row.id || undefined,
        employeeID: row.employeeID,
        date: row.date,
        month,
        year,
        day: row.day,
        present,
        status: editForm.status,
        attendanceIn: editForm.attendanceIn || '-',
        attendanceOut: editForm.attendanceOut || '-',
        late: editForm.late || 'No',
        timeStatus: editForm.timeStatus || (editForm.status === 'Half Day' ? 'Half Time' : editForm.status === 'Present' ? 'Full Time' : '-'),
      });
      setEditingKey('');
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Attendance could not be updated.');
    } finally {
      setLoading(false);
    }
  };

  const removeAttendance = async row => {
    if (!row.id) {
      setError('No saved attendance record found for this day.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deleteAdminAttendance(row.id);
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Attendance could not be deleted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { loadEmployees(); loadAttendance(); }} />}>
      <Card>
        <Text style={styles.title}>Attendance</Text>
        <AppTextInput label="Search employee by name, email, ID, code, or letter" value={search} onChangeText={setSearch} />
        <View style={styles.twoCol}>
          <AppTextInput label="Month" keyboardType="numeric" value={monthFilter} onChangeText={value => setMonthFilter(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
          <AppTextInput label="Year" keyboardType="numeric" value={yearFilter} onChangeText={value => setYearFilter(value.replace(/[^0-9]/g, ''))} style={styles.flex} />
        </View>
        <AppTextInput
          label="Filter by date number"
          placeholder="Example: 1, 8, 16, 31"
          keyboardType="numeric"
          value={dateFilter}
          onChangeText={value => setDateFilter(value.replace(/[^0-9]/g, ''))}
        />
        <Text style={styles.meta}>Employees and leaders: {employees.length}</Text>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Text style={styles.section}>Select Employee</Text>
        <ScrollView nestedScrollEnabled style={styles.employeeList}>
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
        </ScrollView>
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
          {editingKey === row.key ? (
            <View style={styles.editBox}>
              <AppTextInput label="Status (Present, Half Day, Leave, Absent)" value={editForm.status} onChangeText={value => setEdit('status', value)} />
              <View style={styles.twoCol}>
                <AppTextInput label="In Time" placeholder="09:30 AM" value={editForm.attendanceIn} onChangeText={value => setEdit('attendanceIn', value)} style={styles.flex} />
                <AppTextInput label="Out Time" placeholder="06:30 PM" value={editForm.attendanceOut} onChangeText={value => setEdit('attendanceOut', value)} style={styles.flex} />
              </View>
              <View style={styles.twoCol}>
                <AppTextInput label="Late" placeholder="Yes or No" value={editForm.late} onChangeText={value => setEdit('late', value)} style={styles.flex} />
                <AppTextInput label="Time Status" placeholder="Full Time / Half Time" value={editForm.timeStatus} onChangeText={value => setEdit('timeStatus', value)} style={styles.flex} />
              </View>
              <View style={styles.actions}>
                <AppButton icon={Check} title="Update" loading={loading} onPress={() => saveAttendance(row)} />
                <AppButton icon={X} title="Cancel" variant="muted" onPress={() => setEditingKey('')} />
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => startEdit(row)} />
              {row.id ? <AppButton icon={Trash2} title="Delete" variant="danger" onPress={() => removeAttendance(row)} /> : null}
            </View>
          )}
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
  employeeList: {maxHeight: 246},
  employeeRow: {alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm},
  editBox: {gap: spacing.sm, marginTop: spacing.md},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
