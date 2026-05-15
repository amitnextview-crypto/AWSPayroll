import React, {useEffect, useState} from 'react';
import {Alert, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {Trash2} from 'lucide-react-native';
import {deleteAdminTeam, getAdminTeams} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminTeamsScreen = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminTeams();
      setTeams(response?.data || response?.teams || []);
    } catch (err) {
      setError(err.message || 'Teams could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = team => {
    Alert.alert('Delete team', `Delete ${team?.name || 'this team'}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteAdminTeam(team.id || team._id);
        load();
      }},
    ]);
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {teams.map(team => (
        <Card key={team.id || team._id}>
          <View style={styles.row}>
            <View style={styles.fill}>
              <Text style={styles.title}>{team.name || '-'}</Text>
              <Text style={styles.meta}>{team.description || '-'}</Text>
              <Text style={styles.meta}>Leader: {team.leader?.name || '-'}</Text>
            </View>
            <AppButton icon={Trash2} onPress={() => confirmDelete(team)} title="Delete" variant="danger" />
          </View>
        </Card>
      ))}
      {!loading && !teams.length ? <Text style={styles.empty}>No teams found.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  fill: {flex: 1},
  title: {color: colors.text, fontSize: 17, fontWeight: '900'},
  meta: {color: colors.textMuted, marginTop: spacing.xs},
  error: {color: colors.danger},
  empty: {color: colors.textMuted, textAlign: 'center'},
});
