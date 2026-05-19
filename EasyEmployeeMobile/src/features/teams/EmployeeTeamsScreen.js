import React, {useEffect, useState} from 'react';
import {RefreshControl, StyleSheet, Text, View} from 'react-native';
import {UsersRound} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import {getEmployeeTeam, getEmployeeTeamMembers} from '../../api/employeeApi';
import {Card} from '../../components/Card';
import {PageHeader} from '../../components/PageHeader';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const EmployeeTeamsScreen = () => {
  const {user} = useSelector(state => state.auth);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const teamId = user?.team?.id || user?.team?._id || user?.team;
    if (!teamId) {
      setError('');
      setTeam(null);
      setMembers([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const teamResponse = await getEmployeeTeam(teamId);
      const membersResponse = await getEmployeeTeamMembers(teamId);
      setTeam(teamResponse?.data || teamResponse?.team || null);
      setMembers(membersResponse?.data || membersResponse?.members || []);
    } catch (err) {
      setError(err.message || 'Team could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.team]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        eyebrow="Team"
        title="My Team"
        subtitle="Leader and member details for your current team assignment."
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {team ? (
        <Card>
          <Text style={styles.title}>{team.name || 'Team'}</Text>
          <Text style={styles.meta}>{team.description || '-'}</Text>
          <Text style={styles.meta}>Leader: {team.leader?.name || '-'}</Text>
        </Card>
      ) : null}
      {members.map(member => (
        <Card key={member.id || member._id}>
          <Text style={styles.title}>{member.name || member.username || '-'}</Text>
          <Text style={styles.meta}>{member.email || '-'}</Text>
          <Text style={styles.meta}>{member.mobile || '-'}</Text>
        </Card>
      ))}
      {!team && !loading && !error ? (
        <Card style={styles.emptyCard}>
          <View style={styles.iconWrap}>
            <UsersRound color={colors.primary} size={26} />
          </View>
          <Text style={styles.emptyTitle}>Team assignment pending</Text>
          <Text style={styles.emptyText}>
            Your workspace is ready. Once admin assigns you to a team, members and leader details will appear here.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
  emptyCard: {alignItems: 'center', paddingVertical: spacing.xl},
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#2457c518',
    borderRadius: 8,
    height: 58,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 58,
  },
  emptyTitle: {color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.textMuted, lineHeight: 22, marginTop: spacing.sm, textAlign: 'center'},
});
