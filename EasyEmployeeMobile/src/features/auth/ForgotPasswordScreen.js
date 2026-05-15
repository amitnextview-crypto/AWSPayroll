import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {KeyRound, Mail, ShieldCheck} from 'lucide-react-native';
import {forgotPassword, resetPassword} from '../../api/employeeApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Screen} from '../../components/Screen';
import {getThemeColors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export const ForgotPasswordScreen = ({navigation}) => {
  const themeMode = useSelector(state => state.ui.themeMode);
  const colors = getThemeColors(themeMode);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await forgotPassword({email: email.trim()});
      Alert.alert('OTP sent', response?.message || 'Please check your email.');
      setStep('reset');
    } catch (err) {
      setError(err.message || 'OTP could not be sent.');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!otp || !password || !confirmPassword) {
      setError('OTP and new password are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await resetPassword({email: email.trim(), otp, password});
      Alert.alert('Password reset', response?.message || 'Password has been reset.', [
        {text: 'Login', onPress: () => navigation.replace('Login')},
      ]);
    } catch (err) {
      setError(err.message || 'Password could not be reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}>
        <View style={[styles.panel, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={[styles.mark, {backgroundColor: colors.surfaceMuted}]}>
            {step === 'email' ? <Mail color={colors.primary} size={30} /> : <ShieldCheck color={colors.primary} size={30} />}
          </View>
          <Text style={[styles.title, {color: colors.text}]}>
            {step === 'email' ? 'Forgot password' : 'Set new password'}
          </Text>
          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            {step === 'email'
              ? 'Enter your registered email. We will send an OTP for verification.'
              : 'Enter the OTP from email and choose a new secure password.'}
          </Text>

          <View style={styles.form}>
            <AppTextInput
              autoCapitalize="none"
              keyboardType="email-address"
              label="Registered email"
              onChangeText={setEmail}
              value={email}
              editable={step === 'email'}
            />
            {step === 'reset' ? (
              <>
                <AppTextInput label="OTP" keyboardType="numeric" onChangeText={setOtp} value={otp} />
                <AppTextInput label="New password" secureTextEntry onChangeText={setPassword} value={password} />
                <AppTextInput label="Confirm password" secureTextEntry onChangeText={setConfirmPassword} value={confirmPassword} />
              </>
            ) : null}
            {error ? <Text style={[styles.error, {color: colors.danger}]}>{error}</Text> : null}
            <AppButton
              icon={step === 'email' ? Mail : KeyRound}
              loading={loading}
              onPress={step === 'email' ? sendOtp : reset}
              title={step === 'email' ? 'Send OTP' : 'Reset password'}
            />
            <Pressable onPress={() => navigation.replace('Login')}>
              <Text style={[styles.link, {color: colors.primary}]}>Back to login</Text>
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
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.xl,
  },
  mark: {
    alignItems: 'center',
    borderRadius: 8,
    height: 58,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 58,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  error: {
    fontSize: 13,
  },
  link: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
