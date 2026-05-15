import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const AppButton = ({
  title,
  onPress,
  loading,
  disabled,
  icon: Icon,
  variant = 'primary',
}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  const variants = {
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    muted: colors.surfaceMuted,
  };
  const backgroundColor = variants[variant] || colors.primary;
  const isMuted = variant === 'muted';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {backgroundColor, opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1},
      ]}>
      {loading ? (
        <ActivityIndicator color={isMuted ? colors.text : colors.surface} />
      ) : (
        <View style={styles.content}>
          {Icon ? (
            <Icon
              color={isMuted ? colors.text : colors.surface}
              size={18}
              strokeWidth={2.2}
            />
          ) : null}
          <Text style={[styles.text, isMuted && styles.mutedText]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  mutedText: {
    color: colors.text,
  },
});
