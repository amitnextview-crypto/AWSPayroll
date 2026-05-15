import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const AppTextInput = ({label, error, style, ...props}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={[styles.label, {color: colors.text}]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {backgroundColor: colors.surface, borderColor: colors.border, color: colors.text},
          error && {borderColor: colors.danger},
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, {color: colors.danger}]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  error: {
    fontSize: 12,
  },
});
