import React from 'react';
import {StyleSheet, View} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const Card = ({children, style}) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
