import React, {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Platform, StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Lock, LogIn, Mail} from 'lucide-react-native';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Screen} from '../../components/Screen';
import {clearAuthError, loginEmployee} from '../../store/authSlice';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const LoginScreen = () => {
  const dispatch = useDispatch();
  const {loginLoading, error} = useSelector(state => state.auth);
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
    dispatch(loginEmployee({email: email.trim(), password}));
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}>
        <View style={styles.brand}>
          <Text style={styles.title}>Easy Employee</Text>
          <Text style={styles.subtitle}>Payroll, attendance, leave, and salary in one place.</Text>
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
            <Text style={styles.error}>{localError || error}</Text>
          ) : null}

          <AppButton
            icon={LogIn}
            loading={loginLoading}
            onPress={submit}
            title="Login"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    marginBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
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
    color: colors.danger,
    fontSize: 13,
  },
});
