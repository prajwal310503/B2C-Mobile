import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';

import Button from '../ui/Button';
import Field from '../ui/Field';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import { toast } from '../../store/toastStore';
import { toMobile } from '../../utils/phone';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../config';
import { colors, radius, shadows } from '../../theme';

// Admin accounts are staff logins and don't need a contact number
const EXEMPT_ROLES = ['admin', 'child_admin'];
const PHONE_SCOPE = 'https://www.googleapis.com/auth/user.phonenumbers.read';

/**
 * Asks Google for the number on the user's Google profile (People API). Rendered only once
 * client ids are known, since useAuthRequest needs them up front. Reports back through
 * onSaved / onError so the modal can fall back to the manual field.
 */
function GooglePhoneButton({ ids, email, disabled, onSaved, onError }) {
  const [busy, setBusy] = useState(false);
  const nativeClientId =
    (Platform.OS === 'android' ? ids.androidClientId : Platform.OS === 'ios' ? ids.iosClientId : '') || ids.webClientId;
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: ids.webClientId,
    webClientId: ids.webClientId,
    androidClientId: nativeClientId,
    iosClientId: nativeClientId,
    scopes: ['openid', 'email', 'profile', PHONE_SCOPE],
    extraParams: { login_hint: email },
  });

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      if (response.type !== 'dismiss' && response.type !== 'cancel') onError('Google did not share your number — please enter it below.');
      return;
    }
    const accessToken = response.authentication?.accessToken || response.params?.access_token;
    if (!accessToken) {
      onError('Google did not share your number — please enter it below.');
      return;
    }
    (async () => {
      setBusy(true);
      try {
        const { data } = await authAPI.googlePhone(accessToken);
        onSaved(data.data?.user || data.data);
      } catch (err) {
        onError(err?.message || 'Could not get your number from Google — please enter it below.');
      } finally {
        setBusy(false);
      }
    })();
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Button
      label="Use the number on my Google account"
      variant="outline"
      loading={busy}
      disabled={disabled || !request}
      onPress={() => promptAsync()}
      full
    />
  );
}

/**
 * Blocking prompt for signed-in users without a mobile number — mostly Google sign-ups,
 * since Google never shares one. The number is required for orders and OTP login, so the
 * only way past it is saving a number or logging out.
 */
export default function PhoneRequiredModal() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const visible = !!(authReady && user && !user.phone && !EXEMPT_ROLES.includes(user.role));
  const isGoogleUser = user?.authProvider === 'google';
  const [ids, setIds] = useState({
    webClientId: GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: GOOGLE_IOS_CLIENT_ID || '',
  });

  useEffect(() => {
    if (!visible || !isGoogleUser || ids.webClientId) return;
    authAPI
      .getGoogleClientId()
      .then(({ data }) => setIds({
        webClientId: data.data?.clientId || '',
        androidClientId: data.data?.androidClientId || '',
        iosClientId: data.data?.iosClientId || '',
      }))
      .catch(() => {});
  }, [visible, isGoogleUser, ids.webClientId]);

  const submit = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await authAPI.updateProfile({ phone });
      updateUser(data.data?.user || data.data);
      toast.success('Mobile number saved');
    } catch (err) {
      setError(err?.message || 'Could not save your number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.title}>Add your mobile number</Text>
          <Text style={styles.subtitle}>
            We need it for order updates, delivery and OTP login. Hi {user?.name?.split(' ')[0] || 'there'}, please
            add it to continue.
          </Text>
          {isGoogleUser && ids.webClientId ? (
            <>
              <GooglePhoneButton
                ids={ids}
                email={user.email}
                disabled={saving}
                onSaved={(u) => { updateUser(u); toast.success('Mobile number saved from Google'); }}
                onError={setError}
              />
              <Text style={styles.or}>OR ENTER IT</Text>
            </>
          ) : null}
          <Field
            label="Mobile number"
            value={phone}
            onChangeText={(t) => { setPhone(toMobile(t)); setError(''); }}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            icon="call-outline"
            error={error}
            autoFocus
          />
          <Button label="Save & Continue" loading={saving} onPress={submit} full />
          <Pressable onPress={logout} hitSlop={8} style={styles.logout}>
            <Text style={styles.logoutText}>Not you? Log out</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 22,
    gap: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13.5, lineHeight: 20, color: colors.textMuted },
  or: { textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textMuted },
  logout: { alignSelf: 'center', paddingVertical: 4 },
  logoutText: { fontSize: 12.5, color: colors.textMuted },
});
