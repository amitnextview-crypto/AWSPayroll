import React, {useEffect} from 'react';
import {StyleSheet, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const ToastBanner = ({message, type = 'error', onHide}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);

  useEffect(() => {
    if (!message || !onHide) return undefined;
    const timer = setTimeout(onHide, 3500);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;

  const backgroundColor = type === 'success' ? colors.success : colors.danger;
  return <Text style={[styles.banner, {backgroundColor}]}>{message}</Text>;
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    color: '#ffffff',
    fontWeight: '800',
    overflow: 'hidden',
    padding: spacing.md,
  },
});
