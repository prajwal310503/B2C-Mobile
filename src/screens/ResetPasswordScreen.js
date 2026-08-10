import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { authAPI } from '../services/api';
import { toast } from '../store/toastStore';
import { colors, gradients, radius, shadows } from '../theme';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const token = params.token || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(!token);

  const submit = async () => {
    const next = {};
    if (password.length < 6) next.password = 'At least 6 characters';
    if (password !== confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      toast.success('Password updated');
    } catch (err) {
      const msg = err?.message || '';
      if (/invalid|expired/i.test(msg)) {
        setExpired(true);
      } else {
        toast.error(msg || 'Could not reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="New Password" right={<View style={styles.spacer} />} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={gradients.champagne} style={styles.icon}>
            <Ionicons
              name={done ? 'checkmark-circle' : expired ? 'alert-circle-outline' : 'key-outline'}
              size={28}
              color={colors.goldDark}
            />
          </LinearGradient>

          {done ? (
            <>
              <Text style={styles.title}>Password updated</Text>
              <Text style={styles.body}>You can now sign in with your new password.</Text>
              <Button label="Sign in" onPress={() => navigation.replace('Login')} full />
            </>
          ) : expired ? (
            <>
              <Text style={styles.title}>Link expired</Text>
              <Text style={styles.body}>
                This password reset link is invalid or has expired. Reset links are valid for 30
                minutes and can be used once. Please request a new one.
              </Text>
              <Button
                label="Request a new link"
                onPress={() => navigation.replace('ForgotPassword')}
                full
              />
              <Button label="Back to sign in" variant="ghost" onPress={() => navigation.replace('Login')} full />
            </>
          ) : (
            <>
              <Text style={styles.title}>Choose a new password</Text>
              <Text style={styles.body}>Enter a strong password for your account.</Text>
              <View style={[styles.card, shadows.xs]}>
                <Field
                  label="New password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  secure
                  icon="lock-closed-outline"
                  error={errors.password}
                />
                <Field
                  label="Confirm password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat password"
                  secure
                  icon="lock-closed-outline"
                  error={errors.confirm}
                />
                <Button label="Update password" loading={loading} onPress={submit} full />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { width: 40 },
  scroll: { padding: 24, alignItems: 'center', gap: 12 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  card: {
    alignSelf: 'stretch',
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
});
