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
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import useAuthStore from '../store/authStore';
import { colors, gradients, radius, shadows } from '../theme';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const register = useAuthStore((s) => s.register);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const loading = useAuthStore((s) => s.loading);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referralCode: params.referralCode || '',
  });
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (!/^\d{10}$/.test(form.phone)) next.phone = 'Enter a 10-digit number';
    if (form.password.length < 6) next.password = 'At least 6 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        referralCode: form.referralCode.trim().toUpperCase() || undefined,
      });
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
            <Ionicons name="chevron-back" size={23} color={colors.primary} />
          </Pressable>

          <LinearGradient colors={gradients.rose} style={[styles.mark, shadows.sm]}>
            <Ionicons name="sparkles" size={26} color={colors.white} />
          </LinearGradient>

          <View style={styles.headings}>
            <Text style={styles.eyebrow}>Join us</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Get early access to new collections and member-only offers.
            </Text>
          </View>

          <View style={[styles.card, shadows.sm]}>
            <Field
              label="Full name"
              value={form.name}
              onChangeText={(t) => setField('name', t)}
              placeholder="Your name"
              icon="person-outline"
              error={errors.name}
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(t) => setField('email', t)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={errors.email}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChangeText={(t) => setField('phone', t.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              icon="call-outline"
              error={errors.phone}
            />
            <Field
              label="Password"
              value={form.password}
              onChangeText={(t) => setField('password', t)}
              placeholder="At least 6 characters"
              secure
              icon="lock-closed-outline"
              error={errors.password}
            />
            <Field
              label="Referral code (optional)"
              value={form.referralCode}
              onChangeText={(t) => setField('referralCode', t.toUpperCase())}
              placeholder="Friend's invite code"
              autoCapitalize="characters"
              icon="gift-outline"
            />
            <Button label="Create Account" loading={loading} onPress={submit} full />
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
            <GoogleSignInButton
              referralCode={form.referralCode || params.referralCode}
              onSuccess={async (credential, referralCode) => {
                await googleLogin(credential, referralCode);
                if (params.redirect) navigation.replace(params.redirect);
                else navigation.goBack();
              }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.replace('Login', params)} hitSlop={8}>
              <Text style={styles.footerLink}>Sign in</Text>
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
  close: { alignSelf: 'flex-start', padding: 6, marginBottom: 8 },
  mark: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headings: { alignItems: 'center', gap: 6, marginBottom: 22 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  title: { fontSize: 23, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    alignSelf: 'stretch',
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 },
  footerText: { fontSize: 13, color: colors.textMuted },
  footerLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  orText: { fontSize: 11, fontWeight: '700', color: colors.textFaint, letterSpacing: 1 },
});
