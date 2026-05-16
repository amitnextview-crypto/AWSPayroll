import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {ShieldCheck, Trash2, UserMinus, UserPlus} from 'lucide-react-native';
import {
  addAdminTeamMember,
  changeAdminTeamLeader,
  deleteAdminTeam,
  getAdminEmployees,
  getAdminTeamMembers,
  getAdminTeams,
  removeAdminTeamLeader,
  removeAdminTeamMember,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminTeamsScreen = () => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState({});
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [searchByTeam, setSearchByTeam] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const [teamResponse, employeeResponse] = await Promise.all([
        getAdminTeams(),
        getAdminEmployees({limit: 100}),
      ]);
      const nextTeams = teamResponse?.data || teamResponse?.teams || [];
      setTeams(nextTeams);
      setEmployees(employeeResponse?.data || []);
      const memberPairs = await Promise.all(
        nextTeams.map(async team => {
          try {
            const response = await getAdminTeamMembers(team.id || team._id);
            return [team.id || team._id, response?.data || []];
          } catch {
            return [team.id || team._id, []];
          }
        }),
      );
      setMembers(Object.fromEntries(memberPairs));
    } catch (err) {
      setToast(err.message || 'Teams could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleForTeam = (teamId, userId) => {
    setSelectedEmployees(current => {
      const existing = current[teamId] || [];
      return {
        ...current,
        [teamId]: existing.includes(userId)
          ? existing.filter(id => id !== userId)
          : [...existing, userId],
      };
    });
  };

  const setTeamSearch = (teamId, value) => setSearchByTeam(current => ({...current, [teamId]: value}));

  const confirmDelete = team => {
    Alert.alert('Delete team', `Delete ${team?.name || 'this team'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteAdminTeam(team.id || team._id);
          setToast('Team deleted successfully.');
          load();
        } catch (err) {
          setToast(err.message || 'Team could not be deleted.');
        }
      }},
    ]);
  };

  const runTeamAction = async (team, action, multi = false) => {
    const teamId = team.id || team._id;
    const ids = selectedEmployees[teamId] || [];
    if (!ids.length) {
      setToast('Select at least one employee first.');
      return;
    }
    try {
      if (multi) {
        await Promise.all(ids.map(userId => action({teamId, userId})));
      } else {
        await action({teamId, userId: ids[0]});
      }
      setToast('Team updated successfully.');
      setSelectedEmployees(current => ({...current, [teamId]: []}));
      load();
    } catch (err) {
      setToast(err.message || 'Team could not be updated.');
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />
      {teams.map(team => {
        const teamId = team.id || team._id;
        const teamMembers = members[teamId] || [];
        const selected = selectedEmployees[teamId] || [];
        const lower = (searchByTeam[teamId] || '').toLowerCase();
        const filteredEmployees = employees.filter(employee => {
          const text = `${employee.name || ''} ${employee.email || ''} ${employee.username || ''} ${employee.employeeCode || ''} ${employee.id || employee._id || ''} ${employee.department || ''} ${employee.designation || ''}`.toLowerCase();
          return text.includes(lower);
        });
        return (
          <Card key={teamId}>
            <View style={styles.row}>
              <View style={styles.fill}>
                <Text style={styles.title}>{team.name || '-'}</Text>
                <Text style={styles.meta}>{team.description || '-'}</Text>
                <Text style={styles.meta}>Leader: {team.leader?.name || '-'}</Text>
                <Text style={styles.meta}>Members: {teamMembers.length}</Text>
              </View>
              <AppButton icon={Trash2} onPress={() => confirmDelete(team)} title="Delete" variant="danger" />
            </View>
            <Text style={styles.label}>Search and Select Employees</Text>
            <AppTextInput
              label="Search employee, code, department"
              value={searchByTeam[teamId] || ''}
              onChangeText={value => setTeamSearch(teamId, value)}
            />
            <View style={styles.employeeGrid}>
              {filteredEmployees.slice(0, 30).map(employee => {
                const id = employee.id || employee._id;
                const active = selected.includes(id);
                return (
                  <Text
                    key={id}
                    onPress={() => toggleForTeam(teamId, id)}
                    style={[styles.employeeChip, active && styles.employeeChipActive]}>
                    {employee.name || employee.username}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.meta}>
              Selected: {selected.length} / Showing {Math.min(filteredEmployees.length, 30)} of {filteredEmployees.length}
            </Text>
            <View style={styles.actions}>
              <AppButton icon={ShieldCheck} title="Set First as Leader" variant="muted" onPress={() => runTeamAction(team, changeAdminTeamLeader)} />
              <AppButton icon={UserPlus} title="Add Selected" variant="muted" onPress={() => runTeamAction(team, addAdminTeamMember, true)} />
              <AppButton icon={UserMinus} title="Remove Selected" variant="muted" onPress={() => runTeamAction(team, removeAdminTeamMember, true)} />
              {team.leader?.id || team.leader?._id ? (
                <AppButton icon={UserMinus} title="Remove Leader" variant="danger" onPress={() => removeAdminTeamLeader({teamId, userId: team.leader.id || team.leader._id}).then(load).catch(err => setToast(err.message))} />
              ) : null}
            </View>
            {teamMembers.map(member => (
              <Text key={member.id || member._id} style={styles.member}>
                {member.name || member.username} - {member.designation || 'Employee'}
              </Text>
            ))}
          </Card>
        );
      })}
      {!loading && !teams.length ? <Text style={styles.empty}>No teams found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  fill: {flex: 1},
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  label: {color: colors.text, fontSize: 13, fontWeight: '800', marginTop: spacing.md},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  employeeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  employeeChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  employeeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.surface,
  },
  member: {color: colors.textMuted, marginTop: spacing.xs},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
