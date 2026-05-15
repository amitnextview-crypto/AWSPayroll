import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const AppTextInput = ({label, error, style, ...props}) => (
  <View style={[styles.wrapper, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, error && styles.inputError]}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});
