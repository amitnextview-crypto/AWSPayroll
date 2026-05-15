import React, {useState} from 'react';
import {Alert, StyleSheet, Text} from 'react-native';
import {addAdminUser} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {formatApiDate} from '../../utils/date';

export const AdminAddUserScreen = () => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    type: 'employee',
    status: 'Active',
    designation: '',
    workType: 'Onsite',
    address: '',
    date: formatApiDate(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(current => ({...current, [key]: value}));

  const submit = async () => {
    if (!form.name || !form.username || !form.password || !form.type) {
      setError('Name, username, password and type are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await addAdminUser(form);
      Alert.alert('User', response?.message || 'User created.');
      setForm(current => ({...current, name: '', username: '', email: '', mobile: '', password: ''}));
    } catch (err) {
      setError(err.message || 'User could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Add User</Text>
        {['name', 'username', 'email', 'mobile', 'password', 'type', 'designation', 'workType', 'address'].map(key => (
          <AppTextInput
            key={key}
            label={key}
            secureTextEntry={key === 'password'}
            value={form[key]}
            onChangeText={value => set(key, value)}
          />
        ))}
        <AppButton loading={loading} onPress={submit} title="Create User" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: spacing.md},
  error: {color: colors.danger, marginTop: spacing.sm},
});
