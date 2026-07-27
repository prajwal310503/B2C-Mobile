import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import useAuthStore from '../store/authStore';
import { colors, gradients, radius, shadows } from '../theme';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email';
    if (password.length < 6) next.password = 'At least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await login({ email: email.trim().toLowerCase(), password });
      if (params.redirect) navigation.replace(params.redirect);
      else navigation.goBack();
    } catch {
      // The store surfaces the failure through a toast.
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.primary} />
          </Pressable>

          <LinearGradient colors={gradients.gold} style={[styles.mark, shadows.gold]}>
            <Ionicons name="diamond" size={28} color={colors.white} />
          </LinearGradient>

          <View style={styles.headings}>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>Sign in to continue</Text>
            <Text style={styles.subtitle}>
              Track orders, save favourites and check out faster.
            </Text>
          </View>

          <View style={[styles.card, shadows.sm]}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon="mail-outline"
              error={errors.email}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secure
              icon="lock-closed-outline"
              error={errors.password}
            />
            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={6}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            <Button label="Sign In" loading={loading} onPress={submit} full />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Luxury Jewellery?</Text>
            <Pressable onPress={() => navigation.replace('Register', params)} hitSlop={8}>
              <Text style={styles.footerLink}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, alignItems: 'center' },
  close: { alignSelf: 'flex-start', padding: 6, marginBottom: 12 },
  mark: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  headings: { alignItems: 'center', gap: 6, marginBottom: 24 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    alignSelf: 'stretch',
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22 },
  footerText: { fontSize: 13, color: colors.textMuted },
  footerLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12.5, fontWeight: '600', color: colors.primary },
});
