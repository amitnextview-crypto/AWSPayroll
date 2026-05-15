import React, {useEffect, useMemo, useState} from 'react';
import {RefreshControl, StyleSheet, Text} from 'react-native';
import {getAdminAttendance, getAdminEmployees} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {todayParts, formatDisplayDate} from '../../utils/date';

export const AdminAttendanceScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = useMemo(() => todayParts(), []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const users = await getAdminEmployees();
      const employeeList = users?.data || [];
      setEmployees(employeeList);
      const all = [];
      for (const employee of employeeList) {
        const response = await getAdminAttendance({
          employeeID: employee.id || employee._id,
          month: today.month,
          year: today.year,
        });
        (response?.data || []).forEach(item => all.push({...item, employeeName: employee.name}));
      }
      setRecords(all);
    } catch (err) {
      setError(err.message || 'Attendance could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Card>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.meta}>Employees: {employees.length}</Text>
        <Text style={styles.meta}>Records this month: {records.length}</Text>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {records.map((item, index) => (
        <Card key={item._id || String(index)}>
          <Text style={styles.title}>{item.employeeName || 'Employee'}</Text>
          <Text style={styles.meta}>Date: {formatDisplayDate(item)}</Text>
          <Text style={styles.meta}>In: {item.attendanceIn || '-'}</Text>
          <Text style={styles.meta}>Out: {item.attendanceOut || '-'}</Text>
          <Text style={styles.meta}>Hours: {item.totalHours || '-'}</Text>
          <Text style={styles.meta}>Status: {item.present ? 'Present' : 'Absent'}</Text>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
});
