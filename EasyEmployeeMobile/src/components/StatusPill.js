import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {colors} from '../theme/colors';

const toneMap = {
  Approved: colors.success,
  Pending: colors.primary,
  Rejected: colors.danger,
  Yes: colors.danger,
  No: colors.success,
};

export const StatusPill = ({value}) => {
  const tone = toneMap[value] || colors.textMuted;
  return <Text style={[styles.pill, {color: tone, borderColor: tone}]}>{value || '-'}</Text>;
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
