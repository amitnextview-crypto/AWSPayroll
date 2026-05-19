import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const PageHeader = ({eyebrow, title, subtitle, right}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  return (
    <View style={[styles.header, {backgroundColor: colors.ink || colors.text, borderColor: colors.gold || colors.primary}]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={[styles.eyebrow, {color: colors.gold || colors.primary}]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, {color: colors.surface}]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderRadius: 8,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#15100a',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#dfd4c2',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
