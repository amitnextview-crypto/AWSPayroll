import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import {getThemeColors} from '../theme/colors';
import {spacing} from '../theme/spacing';

export const AppTextInput = ({label, error, style, secureTextEntry, ...props}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={[styles.label, {color: colors.text}]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {backgroundColor: colors.surface, borderColor: colors.border},
          error && {borderColor: colors.danger},
        ]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          style={[styles.input, {color: colors.text}, isPassword && styles.passwordInput]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible(current => !current)}
            style={styles.eyeButton}>
            {visible ? (
              <EyeOff color={colors.textMuted} size={20} />
            ) : (
              <Eye color={colors.textMuted} size={20} />
            )}
          </Pressable>
        ) : null}
      </View>
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
  inputShell: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  passwordInput: {
    paddingRight: spacing.xs,
  },
  eyeButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  error: {
    fontSize: 12,
  },
});
