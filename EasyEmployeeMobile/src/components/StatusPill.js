import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {colors} from '../theme/colors';

const toneMap = {
  Approved: colors.success,
  Pending: colors.primary,
  Rejected: colors.danger,
  Present: colors.success,
  Completed: colors.success,
  'Checked In': colors.info,
  'Checked Out': colors.success,
  'Full Time': colors.success,
  'Half Day': colors.warning,
  'Half Time': colors.warning,
  Leave: colors.info,
  'Approved Leave': colors.info,
  'Weekly Off': colors.warning,
  Holiday: colors.gold,
  Absent: colors.danger,
  Late: colors.warning,
  Yes: colors.danger,
  No: colors.success,
};

export const StatusPill = ({value}) => {
  const normalized = String(value || '').trim();
  const lower = normalized.toLowerCase();
  const tone =
    toneMap[normalized] ||
    (lower.includes('present') || lower.includes('completed') ? colors.success : null) ||
    (lower.includes('weekly') || lower.includes('half') || lower.includes('late') ? colors.warning : null) ||
    (lower.includes('leave') || lower.includes('holiday') ? colors.info : null) ||
    (lower.includes('absent') || lower.includes('rejected') ? colors.danger : null) ||
    colors.textMuted;
  return (
    <Text style={[styles.pill, {backgroundColor: tone, borderColor: tone, color: colors.surface}]}>
      {normalized || '-'}
    </Text>
  );
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
