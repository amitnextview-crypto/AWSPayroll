import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const MenuGrid = ({items}) => (
  <View style={styles.grid}>
    {items.map(item => {
      const Icon = item.icon;
      return (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={({pressed}) => [styles.item, pressed && styles.pressed]}>
          <View style={styles.iconBox}>{Icon ? <Icon color={colors.primary} size={20} /> : null}</View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>{item.label}</Text>
            {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
          </View>
          <ChevronRight color={colors.textMuted} size={18} />
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
