import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

const accents = ['#8a6432', '#236f73', '#b27a22', '#5c6f38', '#1f7a5a', '#b6423c'];

export const MenuGrid = ({items}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  return (
  <View style={styles.grid}>
    {items.map((item, index) => {
      const Icon = item.icon;
      const accent = accents[index % accents.length];
      return (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={({pressed}) => [styles.item, {backgroundColor: colors.surface, borderColor: colors.border}, pressed && styles.pressed]}>
          <View style={[styles.iconBox, {backgroundColor: `${accent}1f`, borderColor: `${accent}55`}]}>{Icon ? <Icon color={accent} size={20} /> : null}</View>
          <View style={styles.textWrap}>
            <Text style={[styles.label, {color: colors.text}]}>{item.label}</Text>
            {item.caption ? <Text style={[styles.caption, {color: colors.textMuted}]}>{item.caption}</Text> : null}
          </View>
          <ChevronRight color={colors.textMuted} size={18} />
        </Pressable>
      );
    })}
  </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md,
    shadowColor: '#2a2116',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  pressed: {
    opacity: 0.78,
  },
  iconBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '900',
  },
  caption: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
