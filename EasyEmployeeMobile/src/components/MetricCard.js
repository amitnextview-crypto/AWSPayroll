import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {Card} from './Card';

export const MetricCard = ({label, value, tone = 'primary', icon: Icon}) => (
  <Card style={styles.card}>
    <View style={[styles.iconWrap, {backgroundColor: tones[tone] || tones.primary}]}>
      {Icon ? <Icon color={colors.surface} size={20} /> : null}
    </View>
    <Text style={styles.value}>{value ?? '-'}</Text>
    <Text style={styles.label}>{label}</Text>
  </Card>
);

const tones = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  info: colors.info,
};

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 126,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 38,
  },
  value: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
