import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Edit3, Trash2, UserPlus, X} from 'lucide-react-native';
import {
  deleteAdminTeam,
  getAdminTeamMembers,
  getAdminTeams,
  updateAdminTeam,
} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const idOf = item => String(item?.id || item?._id || '');

export const AdminTeamsScreen = ({navigation}) => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState({});
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({name: '', description: ''});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const teamResponse = await getAdminTeams();
      const nextTeams = teamResponse?.data || teamResponse?.teams || [];
      setTeams(nextTeams);
      const memberPairs = await Promise.all(
        nextTeams.map(async team => {
          try {
            const teamId = idOf(team);
            const response = await getAdminTeamMembers(teamId);
            return [teamId, response?.data || []];
          } catch {
            return [idOf(team), []];
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

  const startEdit = team => {
    setEditingId(idOf(team));
    setEditForm({
      name: team.name || '',
      description: team.description || '',
    });
  };

  const saveEdit = async team => {
    if (!editForm.name.trim()) {
      setToast('Team name is required.');
      return;
    }
    setLoading(true);
    setToast('');
    try {
      await updateAdminTeam(idOf(team), {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      setEditingId('');
      setToast('Team updated successfully.');
      await load();
    } catch (err) {
      setToast(err.message || 'Team could not be updated.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = team => {
    Alert.alert('Delete team', `Delete ${team?.name || 'this team'}? Assigned people will become available again.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteAdminTeam(idOf(team));
            setToast('Team deleted successfully.');
            await load();
          } catch (err) {
            setToast(err.message || 'Team could not be deleted.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <ToastBanner message={toast} type={toast.includes('success') ? 'success' : 'error'} onHide={() => setToast('')} />
      <PageHeader
        eyebrow="Team structure"
        title="Teams"
        subtitle="Created teams appear here with their leader, employees, edit, and delete controls."
      />
      <Card>
        <View style={styles.headingRow}>
          <View style={styles.fill}>
            <Text style={styles.title}>Team List</Text>
            <Text style={styles.meta}>{teams.length} team(s) created</Text>
          </View>
          <AppButton icon={UserPlus} title="Add Team" onPress={() => navigation?.navigate?.('AdminAddTeam')} />
        </View>
      </Card>

      {teams.map(team => {
        const teamId = idOf(team);
        const teamMembers = members[teamId] || [];
        const leaderId = idOf(team.leader);
        const employeeMembers = teamMembers.filter(member => idOf(member) !== leaderId);
        const editing = editingId === teamId;
        return (
          <Card key={teamId}>
            {editing ? (
              <>
                <Text style={styles.title}>Edit Team</Text>
                <AppTextInput label="Team name" value={editForm.name} onChangeText={name => setEditForm(current => ({...current, name}))} />
                <AppTextInput label="Description" value={editForm.description} onChangeText={description => setEditForm(current => ({...current, description}))} multiline />
                <View style={styles.actions}>
                  <AppButton icon={Edit3} title="Save" loading={loading} onPress={() => saveEdit(team)} />
                  <AppButton icon={X} title="Cancel" variant="muted" onPress={() => setEditingId('')} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.headingRow}>
                  <View style={styles.fill}>
                    <Text style={styles.title}>{team.name || '-'}</Text>
                    <Text style={styles.meta}>{team.description || '-'}</Text>
                    <Text style={styles.meta}>Leader: {team.leader?.name || '-'}</Text>
                    <Text style={styles.meta}>Employees: {employeeMembers.length}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <AppButton icon={Edit3} title="Edit" variant="muted" onPress={() => startEdit(team)} />
                    <AppButton icon={Trash2} title="Delete" variant="danger" onPress={() => confirmDelete(team)} />
                  </View>
                </View>
                <ScrollView nestedScrollEnabled style={styles.memberList}>
                  {employeeMembers.map(member => (
                    <Text key={idOf(member)} style={styles.member}>
                      {member.name || member.username} - {member.designation || 'Employee'}
                    </Text>
                  ))}
                </ScrollView>
                {!employeeMembers.length ? <Text style={styles.empty}>No employees assigned.</Text> : null}
              </>
            )}
          </Card>
        );
      })}
      {!loading && !teams.length ? <Text style={styles.empty}>No teams found. Create one from Add Team.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headingRow: {alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between'},
  fill: {flex: 1},
  title: {color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: spacing.xs},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  cardActions: {gap: spacing.sm},
  memberList: {maxHeight: 160, marginTop: spacing.sm},
  member: {borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.textMuted, paddingVertical: spacing.xs},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
