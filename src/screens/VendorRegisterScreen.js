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
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { vendorAPI } from '../services/api';
import { toast } from '../store/toastStore';
import { colors, gradients, radius, shadows } from '../theme';

const EMPTY = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  shopName: '',
  city: '',
  agreeTerms: false,
};

export default function VendorRegisterScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const submit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = '10-digit phone required';
    if (!form.shopName.trim()) e.shopName = 'Shop name is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.agreeTerms) e.agreeTerms = 'Accept the Terms & Conditions to continue';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await vendorAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
        shopName: form.shopName.trim(),
        city: form.city.trim(),
        agreeTerms: true,
      });
      setDone(true);
      toast.success('Registered! Complete KYC after login.');
    } catch (error) {
      toast.error(error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <AppHeader title="Application Received" right={<View style={styles.spacer} />} />
        <View style={styles.doneWrap}>
          <LinearGradient colors={gradients.champagne} style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={34} color={colors.sage} />
          </LinearGradient>
          <Text style={styles.doneTitle}>You&apos;re on the list</Text>
          <Text style={styles.doneBody}>
            Our team reviews vendor applications within 24–48 hours. Once approved, sign in to the
            web vendor panel to complete KYC and list your first products.
          </Text>
          <Button
            label="Back to home"
            onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            full
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Vendor Registration" right={<View style={styles.spacer} />} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={70}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Register your jewellery shop</Text>
            <Text style={styles.introBody}>
              Zero listing fees. Your store goes live within 48 hours of approval.
            </Text>
          </View>

          <View style={[styles.card, shadows.sm]}>
            <Field
              label="Full name"
              value={form.name}
              onChangeText={(t) => set('name', t)}
              placeholder="Your name"
              error={errors.name}
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(t) => set('email', t)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Field
              label="Password"
              value={form.password}
              onChangeText={(t) => set('password', t)}
              placeholder="At least 6 characters"
              secure
              error={errors.password}
            />
            <Field
              label="Confirm password"
              value={form.confirmPassword}
              onChangeText={(t) => set('confirmPassword', t)}
              placeholder="Repeat password"
              secure
              error={errors.confirmPassword}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChangeText={(t) => set('phone', t.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              keyboardType="number-pad"
              error={errors.phone}
            />
            <Field
              label="Shop name"
              value={form.shopName}
              onChangeText={(t) => set('shopName', t)}
              placeholder="e.g. Shree Jewellers"
              error={errors.shopName}
            />
            <Field
              label="City"
              value={form.city}
              onChangeText={(t) => set('city', t)}
              placeholder="e.g. Mumbai"
              error={errors.city}
            />

            <Pressable
              onPress={() => set('agreeTerms', !form.agreeTerms)}
              style={styles.termsRow}
            >
              <Ionicons
                name={form.agreeTerms ? 'checkbox' : 'square-outline'}
                size={20}
                color={form.agreeTerms ? colors.primary : colors.textFaint}
              />
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('StaticPage', { pageKey: 'terms' })}
                >
                  Terms &amp; Conditions
                </Text>{' '}
                and seller marketplace policies.
              </Text>
            </Pressable>
            {errors.agreeTerms ? <Text style={styles.error}>{errors.agreeTerms}</Text> : null}

            <Button label="Submit application" loading={loading} onPress={submit} full />
          </View>

          <Text style={styles.footNote}>
            Product uploads, KYC, and payouts are managed from the web vendor panel.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { width: 38 },
  scroll: { padding: 16, gap: 14, paddingBottom: 36 },
  intro: { gap: 5, paddingHorizontal: 4, paddingTop: 6 },
  introTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  introBody: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  card: {
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  termsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 2 },
  termsText: { flex: 1, fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  termsLink: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  error: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  footNote: {
    fontSize: 11.5,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 13 },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { fontSize: 21, fontWeight: '800', color: colors.text },
  doneBody: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
});
