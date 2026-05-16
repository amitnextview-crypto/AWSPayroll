import React, {useState} from 'react';
import {Alert, StyleSheet, Switch, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {LogOut, Moon, Save, Sun} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Card} from '../../components/Card';
import {FilterChips} from '../../components/FilterChips';
import {Screen} from '../../components/Screen';
import {ToastBanner} from '../../components/ToastBanner';
import {logoutUser} from '../../store/authSlice';
import {setTheme} from '../../store/uiSlice';
import {getThemeColors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const themeItems = [
  {label: 'Light', value: 'light'},
  {label: 'Dark', value: 'dark'},
];

export const AdminSettingsScreen = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    backupEnabled: true,
    companyName: 'Amit Web Solution Company',
    supportEmail: 'amitwebsolutioncompany@gmail.com',
  });
  const [toast, setToast] = useState('');

  const toggle = key => setSettings(current => ({...current, [key]: !current[key]}));
  const set = (key, value) => setSettings(current => ({...current, [key]: value}));

  const logout = () => {
    Alert.alert('Logout', 'Logout from admin panel?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser())},
    ]);
  };

  return (
    <Screen>
      <ToastBanner message={toast} type="success" onHide={() => setToast('')} />
      <Card>
        <Text style={[styles.title, {color: colors.text}]}>Settings</Text>
        <Text style={[styles.meta, {color: colors.textMuted}]}>Theme, notifications, security, company and system preferences</Text>
      </Card>

      <Card>
        <Text style={[styles.section, {color: colors.text}]}>Theme</Text>
        <FilterChips items={themeItems} value={themeMode} onChange={value => dispatch(setTheme(value))} />
        <View style={styles.actions}>
          <AppButton icon={themeMode === 'dark' ? Sun : Moon} title={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'} variant="muted" onPress={() => dispatch(setTheme(themeMode === 'dark' ? 'light' : 'dark'))} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.section, {color: colors.text}]}>Company Settings</Text>
        <AppTextInput label="Company Name" value={settings.companyName} onChangeText={value => set('companyName', value)} />
        <AppTextInput label="Support Email" value={settings.supportEmail} onChangeText={value => set('supportEmail', value)} />
      </Card>

      <Card>
        <Text style={[styles.section, {color: colors.text}]}>Notification Settings</Text>
        {[
          ['emailAlerts', 'Email alerts'],
          ['smsAlerts', 'SMS alerts'],
          ['backupEnabled', 'Automatic backup'],
        ].map(([key, label]) => (
          <View key={key} style={[styles.row, {borderBottomColor: colors.border}]}>
            <Text style={[styles.value, {color: colors.text}]}>{label}</Text>
            <Switch value={settings[key]} onValueChange={() => toggle(key)} />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[styles.section, {color: colors.text}]}>Security & Permissions</Text>
        <Text style={[styles.meta, {color: colors.textMuted}]}>Admin access is role-based. Password rotation is recommended every 90 days. Login attempt limit is 5 attempts.</Text>
        <Text style={[styles.meta, {color: colors.textMuted}]}>Backup, email, SMS and company preferences can be connected to backend persistence when environment credentials are available.</Text>
      </Card>

      <View style={styles.actions}>
        <AppButton icon={Save} title="Save Settings" onPress={() => setToast('Settings saved locally.')} />
        <AppButton icon={LogOut} title="Logout" variant="danger" onPress={logout} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {fontSize: 22, fontWeight: '900'},
  section: {fontSize: 17, fontWeight: '900', marginBottom: spacing.md},
  meta: {lineHeight: 22, marginTop: spacing.xs},
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  value: {fontSize: 15, fontWeight: '800'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
});
