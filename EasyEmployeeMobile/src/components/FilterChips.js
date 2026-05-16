import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const FilterChips = ({items, value, onChange}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {items.map(item => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surfaceMuted,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}>
            <Text style={[styles.text, {color: active ? colors.surface : colors.text}]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
  },
});
