import React, {useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text} from 'react-native';
import {addAdminTeam, getAdminEmployees} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminAddTeamScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leader, setLeader] = useState('');
  const [leaderSearch, setLeaderSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getAdminEmployees({limit: 100})
      .then(response => setEmployees(response?.data || []))
      .catch(err => setToast(err.message || 'Employees could not be loaded.'));
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = leaderSearch.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(employee =>
      `${employee.name || ''} ${employee.email || ''} ${employee.username || ''} ${employee.employeeCode || ''} ${employee.id || employee._id || ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [employees, leaderSearch]);

  const submit = async () => {
    if (!name.trim()) {
      setToast('Team name is required.');
      return;
    }
    if (!leader) {
      setToast('Select one employee as team leader.');
      return;
    }
    setLoading(true);
    setToast('');
    try {
      const response = await addAdminTeam({name: name.trim(), description: description.trim(), leader});
      Alert.alert('Team', response?.message || 'Team created.');
      setName('');
      setDescription('');
      setLeader('');
    } catch (err) {
      setToast(err.message || 'Team could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ToastBanner message={toast} onHide={() => setToast('')} />
      <Card>
        <Text style={styles.title}>Create Team</Text>
        <AppTextInput label="Team name" value={name} onChangeText={setName} />
        <AppTextInput label="Description" value={description} onChangeText={setDescription} multiline />
        <Text style={styles.label}>Team Leader</Text>
        <AppTextInput
          label="Search by letter, name, email, or ID"
          value={leaderSearch}
          onChangeText={setLeaderSearch}
        />
        <FilterChips
          value={leader}
          onChange={setLeader}
          items={filteredEmployees.map(employee => ({
            value: employee.id || employee._id,
            label: `${employee.name || employee.username} (${employee.email || employee.employeeCode || 'Team'})`,
          }))}
        />
        <Text style={styles.hint}>Selected employee is automatically promoted into the Leaders tab.</Text>
        <AppButton loading={loading} onPress={submit} title="Create Team" />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  label: {color: colors.text, fontSize: 13, fontWeight: '800'},
  hint: {color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm, marginTop: spacing.xs},
});
