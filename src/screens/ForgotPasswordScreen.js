import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { authAPI } from '../services/api';
import { toast } from '../store/toastStore';
import { colors, gradients, radius, shadows } from '../theme';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(value)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(value);
      setSent(true);
    } catch (err) {
      toast.error(err?.message || 'Could not send the reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Reset Password" right={<View style={styles.spacer} />} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={gradients.champagne} style={styles.icon}>
            <Ionicons
              name={sent ? 'mail-open-outline' : 'lock-closed-outline'}
              size={28}
              color={colors.goldDark}
            />
          </LinearGradient>

          {sent ? (
            <>
              <Text style={styles.title}>Check your inbox</Text>
              <Text style={styles.body}>
                We have sent a password reset link to {email.trim().toLowerCase()}. The link expires
                in 30 minutes.
              </Text>
              <View style={[styles.card, shadows.xs]}>
                <Text style={styles.tip}>
                  Not seeing it? Check your spam folder, or try again with a different email address.
                </Text>
              </View>
              <Button label="Back to sign in" onPress={() => navigation.goBack()} full />
              <Button
                label="Use another email"
                variant="ghost"
                onPress={() => {
                  setSent(false);
                  setEmail('');
                }}
                full
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.body}>
                Enter the email linked to your account and we will send you a secure link to set a
                new password.
              </Text>
              <View style={[styles.card, shadows.xs]}>
                <Field
                  label="Email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icon="mail-outline"
                  error={error}
                />
                <Button label="Send reset link" loading={loading} onPress={submit} full />
              </View>
              <Button
                label="Back to sign in"
                variant="ghost"
                onPress={() => navigation.goBack()}
                full
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { width: 38 },
  scroll: { padding: 22, paddingTop: 34, gap: 14, alignItems: 'stretch' },
  icon: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 6,
  },
  card: {
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  tip: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
});
