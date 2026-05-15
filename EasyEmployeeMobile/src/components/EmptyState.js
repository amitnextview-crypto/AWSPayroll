import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const EmptyState = ({title, message}) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  message: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
