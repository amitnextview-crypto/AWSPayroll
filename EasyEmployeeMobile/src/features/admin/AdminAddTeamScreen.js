import React, {useState} from 'react';
import {Alert, StyleSheet, Text} from 'react-native';
import {addAdminTeam} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const AdminAddTeamScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name) {
      setError('Team name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await addAdminTeam({name, description});
      Alert.alert('Team', response?.message || 'Team created.');
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Team could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Add Team</Text>
        <AppTextInput label="Team name" value={name} onChangeText={setName} />
        <AppTextInput label="Description" value={description} onChangeText={setDescription} />
        <AppButton loading={loading} onPress={submit} title="Create Team" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  error: {color: colors.danger, marginTop: spacing.sm},
});
