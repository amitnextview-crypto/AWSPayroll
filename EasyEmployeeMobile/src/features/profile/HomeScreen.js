import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const HomeScreen = () => {
  const {user} = useSelector(state => state.auth);

  return (
    <Screen>
      <View>
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
        <Text style={styles.sub}>Employee payroll app</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.meta}>Role: {user?.type}</Text>
        <Text style={styles.meta}>Designation: {user?.designation || '-'}</Text>
        <Text style={styles.meta}>Work Type: {user?.workType || '-'}</Text>
        <Text style={styles.meta}>Status: {user?.status || '-'}</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.meta}>
          Use Attendance for GPS-verified check-in and check-out. Leave and salary are pulled directly from the existing backend.
        </Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  sub: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  meta: {
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
