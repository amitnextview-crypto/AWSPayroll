import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Lock, LogIn, Mail, Moon, ShieldCheck, Sun} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Screen} from '../../components/Screen';
import {clearAuthError, loginUser} from '../../store/authSlice';
import {toggleTheme} from '../../store/uiSlice';
import {getThemeColors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const LoginScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {loginLoading, error} = useSelector(state => state.auth);
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    return () => dispatch(clearAuthError());
  }, [dispatch]);

  const submit = () => {
    if (!email.trim() || !password) {
      setLocalError('Email or username and password are required.');
      return;
    }
    setLocalError('');
    dispatch(loginUser({email: email.trim(), password}));
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}>
        <Pressable
          onPress={() => dispatch(toggleTheme())}
          style={[styles.themeButton, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          {themeMode === 'dark' ? <Sun color={colors.primary} size={18} /> : <Moon color={colors.primary} size={18} />}
          <Text style={[styles.themeText, {color: colors.text}]}>{themeMode === 'dark' ? 'Light' : 'Dark'}</Text>
        </Pressable>

        <View style={[styles.panel, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={[styles.brandMark, {backgroundColor: colors.surfaceMuted}]}>
            <ShieldCheck color={colors.primary} size={32} />
          </View>
          <View style={styles.brand}>
            <Text style={[styles.eyebrow, {color: colors.primary}]}>Target Management</Text>
            <Text style={[styles.title, {color: colors.text}]}>AWSPayroll</Text>
            <Text style={[styles.subtitle, {color: colors.textMuted}]}>Secure admin and employee payroll access.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputIconRow}>
              <Mail color={colors.primary} size={20} />
              <AppTextInput
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email or username"
                onChangeText={setEmail}
                value={email}
                style={styles.input}
              />
            </View>
            <View style={styles.inputIconRow}>
              <Lock color={colors.primary} size={20} />
              <AppTextInput
                label="Password"
                onChangeText={setPassword}
                secureTextEntry
                value={password}
                style={styles.input}
              />
            </View>

            {localError || error ? (
              <Text style={[styles.error, {color: colors.danger}]}>{localError || error}</Text>
            ) : null}

            <AppButton
              icon={LogIn}
              loading={loginLoading}
              onPress={submit}
              title="Login"
            />

            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.forgot, {color: colors.primary}]}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  themeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  themeText: {
    fontWeight: '800',
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.xl,
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: 8,
    height: 62,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 62,
  },
  brand: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  inputIconRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
  },
  input: {
    flex: 1,
  },
  error: {
    fontSize: 13,
  },
  forgot: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
