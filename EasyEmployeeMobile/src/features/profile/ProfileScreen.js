import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {LogOut} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {logoutEmployee} from '../../store/authSlice';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

const Row = ({label, value}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

export const ProfileScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector(state => state.auth);

  return (
    <Screen>
      <Card>
        <View style={styles.header}>
          {user?.profile ? <Image source={{uri: user.profile}} style={styles.avatar} /> : null}
          <View style={styles.headerText}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.role}>{user?.designation || user?.type}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Row label="Username" value={user?.username} />
        <Row label="Email" value={user?.email} />
        <Row label="Mobile" value={user?.mobile} />
        <Row label="Work Type" value={user?.workType} />
        <Row label="Status" value={user?.status} />
        <Row label="Address" value={user?.address} />
        <Row label="PAN" value={user?.panNumber} />
        <Row label="UAN" value={user?.uan} />
        <Row label="ESI" value={user?.esi} />
      </Card>

      <AppButton
        icon={LogOut}
        onPress={() => dispatch(logoutEmployee())}
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 76,
    width: 76,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  role: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 15,
  },
});
