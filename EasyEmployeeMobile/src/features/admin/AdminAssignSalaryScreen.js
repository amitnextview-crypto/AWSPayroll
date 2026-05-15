import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text} from 'react-native';
import {assignAdminSalary, getAdminEmployees} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminAssignSalaryScreen = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeID, setEmployeeID] = useState('');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminEmployees()
      .then(response => setEmployees(response?.data || []))
      .catch(err => setError(err.message));
  }, []);

  const submit = async () => {
    if (!employeeID || !salary) {
      setError('Employee ID and salary are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await assignAdminSalary({employeeID, salary: Number(salary)});
      Alert.alert('Salary', response?.message || 'Salary assigned.');
      setSalary('');
    } catch (err) {
      setError(err.message || 'Salary could not be assigned.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Assign Salary</Text>
        <AppTextInput label="Employee ID" value={employeeID} onChangeText={setEmployeeID} />
        <AppTextInput label="Salary amount" keyboardType="numeric" value={salary} onChangeText={setSalary} />
        <AppButton loading={loading} onPress={submit} title="Assign Salary" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
      <Text style={styles.hint}>Tap-copy an employee ID from this list into the field above.</Text>
      {employees.map(employee => (
        <Card key={employee.id || employee._id}>
          <Text style={styles.name}>{employee.name || employee.username}</Text>
          <Text selectable style={styles.meta}>{employee.id || employee._id}</Text>
          <Text style={styles.meta}>{employee.email || '-'}</Text>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  name: {color: colors.text, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  hint: {color: colors.textMuted},
  error: {color: colors.danger, marginTop: spacing.sm},
});
