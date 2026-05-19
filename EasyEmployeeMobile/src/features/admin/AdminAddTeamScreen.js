import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Users} from 'lucide-react-native';
import {addAdminTeam, getAdminEmployees} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const idOf = item => String(item?.id || item?._id || '');
const isFreeEmployee = employee => String(employee?.type || '').toLowerCase() === 'employee' && !employee?.team;
const employeeText = employee =>
  `${employee.name || ''} ${employee.email || ''} ${employee.username || ''} ${employee.employeeCode || ''} ${idOf(employee)} ${employee.department || ''} ${employee.designation || ''}`.toLowerCase();

const SelectableRow = ({employee, active, onPress, rightText}) => (
  <Pressable onPress={onPress} style={[styles.selectRow, active ? styles.selectRowActive : null]}>
    <View style={styles.fill}>
      <Text style={[styles.name, active ? styles.activeText : null]}>{employee.name || employee.username || '-'}</Text>
      <Text style={[styles.meta, active ? styles.activeText : null]}>
        {employee.employeeCode || employee.username || idOf(employee)} / {employee.department || '-'}
      </Text>
    </View>
    <Text style={[styles.badge, active ? styles.badgeActive : null]}>{rightText}</Text>
  </Pressable>
);

export const AdminAddTeamScreen = ({navigation}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leader, setLeader] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const response = await getAdminEmployees({limit: 500});
      setEmployees((response?.data || []).filter(isFreeEmployee));
    } catch (err) {
      setToast(err.message || 'Employees could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(employee => employeeText(employee).includes(term));
  }, [employees, search]);

  const leaderRows = useMemo(
    () => visibleEmployees.filter(employee => !selectedMembers.includes(idOf(employee))),
    [selectedMembers, visibleEmployees],
  );

  const memberRows = useMemo(
    () => visibleEmployees.filter(employee => idOf(employee) !== leader),
    [leader, visibleEmployees],
  );

  const toggleMember = employeeId => {
    setSelectedMembers(current =>
      current.includes(employeeId)
        ? current.filter(id => id !== employeeId)
        : [...current, employeeId],
    );
  };

  const submit = async () => {
    if (!name.trim()) {
      setToast('Team name is required.');
      return;
    }
    if (!leader) {
      setToast('Select one free employee as team leader.');
      return;
    }
    setLoading(true);
    setToast('');
    try {
      const response = await addAdminTeam({
        name: name.trim(),
        description: description.trim(),
        leader,
        members: selectedMembers,
      });
      Alert.alert('Team', response?.message || 'Team created.', [
        {text: 'OK', onPress: () => navigation?.navigate?.('AdminTeams')},
      ]);
      setName('');
      setDescription('');
      setLeader('');
      setSelectedMembers([]);
      await load();
    } catch (err) {
      setToast(err.message || 'Team could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ToastBanner message={toast} onHide={() => setToast('')} />
      <PageHeader
        eyebrow="Team setup"
        title="Add Team"
        subtitle="Create a team with one leader and multiple employees. Already assigned people stay hidden."
      />
      <Card>
        <Text style={styles.title}>Team Details</Text>
        <AppTextInput label="Team name" value={name} onChangeText={setName} />
        <AppTextInput label="Description" value={description} onChangeText={setDescription} multiline />
        <AppTextInput
          label="Search free employees"
          placeholder="Name, email, ID, department"
          value={search}
          onChangeText={setSearch}
        />
        <Text style={styles.count}>{employees.length} available for assignment</Text>
      </Card>

      <Card>
        <Text style={styles.title}>Team Leader</Text>
        <ScrollView nestedScrollEnabled style={styles.picker}>
          {leaderRows.map(employee => {
            const id = idOf(employee);
            return (
              <SelectableRow
                key={id}
                active={leader === id}
                employee={employee}
                onPress={() => setLeader(id)}
                rightText={leader === id ? 'Leader' : 'Select'}
              />
            );
          })}
          {!leaderRows.length ? <Text style={styles.empty}>No free leader candidate found.</Text> : null}
        </ScrollView>
      </Card>

      <Card>
        <View style={styles.headingRow}>
          <Text style={styles.title}>Employees</Text>
          <Text style={styles.count}>{selectedMembers.length} selected</Text>
        </View>
        <ScrollView nestedScrollEnabled style={styles.picker}>
          {memberRows.map(employee => {
            const id = idOf(employee);
            const active = selectedMembers.includes(id);
            return (
              <SelectableRow
                key={id}
                active={active}
                employee={employee}
                onPress={() => toggleMember(id)}
                rightText={active ? 'Added' : 'Add'}
              />
            );
          })}
          {!memberRows.length ? <Text style={styles.empty}>No free employees found.</Text> : null}
        </ScrollView>
        <AppButton icon={Users} loading={loading} onPress={submit} title="Create Team" />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: spacing.sm},
  headingRow: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  fill: {flex: 1},
  picker: {maxHeight: 280},
  selectRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  selectRowActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  name: {color: colors.text, fontSize: 15, fontWeight: '900'},
  meta: {color: colors.textMuted, fontSize: 12, marginTop: spacing.xs},
  activeText: {color: colors.surface},
  badge: {color: colors.primary, fontSize: 12, fontWeight: '900'},
  badgeActive: {color: colors.surface},
  count: {color: colors.textMuted, fontWeight: '800', marginBottom: spacing.sm},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
