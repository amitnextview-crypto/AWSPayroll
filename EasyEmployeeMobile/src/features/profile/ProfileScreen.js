import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {LogOut, Moon, Sun} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {logoutUser} from '../../store/authSlice';
import {toggleTheme} from '../../store/uiSlice';
import {getThemeColors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const Row = ({label, value, colors}) => (
  <View style={[styles.row, {borderBottomColor: colors.border}]}>
    <Text style={[styles.label, {color: colors.textMuted}]}>{label}</Text>
    <Text style={[styles.value, {color: colors.text}]}>{value || '-'}</Text>
  </View>
);

export const ProfileScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);

  return (
    <Screen>
      <Card>
        <View style={styles.header}>
          {user?.profile ? <Image source={{uri: user.profile}} style={[styles.avatar, {backgroundColor: colors.surfaceMuted}]} /> : null}
          <View style={styles.headerText}>
            <Text style={[styles.name, {color: colors.text}]}>{user?.name}</Text>
            <Text style={[styles.role, {color: colors.textMuted}]}>{user?.designation || user?.type}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Row colors={colors} label="Username" value={user?.username} />
        <Row colors={colors} label="Email" value={user?.email} />
        <Row colors={colors} label="Mobile" value={user?.mobile} />
        <Row colors={colors} label="Work Type" value={user?.workType} />
        <Row colors={colors} label="Status" value={user?.status} />
        <Row colors={colors} label="Address" value={user?.address} />
        <Row colors={colors} label="PAN" value={user?.panNumber} />
        <Row colors={colors} label="UAN" value={user?.uan} />
        <Row colors={colors} label="ESI" value={user?.esi} />
      </Card>

      <AppButton
        icon={themeMode === 'dark' ? Sun : Moon}
        onPress={() => dispatch(toggleTheme())}
        title={themeMode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        variant="muted"
      />

      <AppButton
        icon={LogOut}
        onPress={() => dispatch(logoutUser())}
        title="Logout"
        variant="danger"
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  avatar: {
    borderRadius: 8,
    height: 76,
    width: 76,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
  },
  role: {
    marginTop: spacing.xs,
  },
  row: {
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    fontSize: 15,
  },
});
