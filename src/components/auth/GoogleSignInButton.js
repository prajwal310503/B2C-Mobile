import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { authAPI } from '../../services/api';
import { GOOGLE_WEB_CLIENT_ID } from '../../config';
import { toast } from '../../store/toastStore';
import { colors, radius } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

/**
 * Google Sign-In via ID token (same credential the backend googleAuth verifies).
 * Uses the Web OAuth client for Expo Go; production APK may also need an Android client ID.
 */
export default function GoogleSignInButton({ onSuccess, referralCode, label = 'Continue with Google' }) {
  const [clientId, setClientId] = useState(GOOGLE_WEB_CLIENT_ID || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (clientId) return;
    let cancelled = false;
    authAPI
      .getGoogleClientId()
      .then(({ data }) => {
        if (!cancelled) setClientId(data.data?.clientId || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    clientId
      ? {
          clientId,
          webClientId: clientId,
        }
      : { clientId: 'placeholder.apps.googleusercontent.com' }
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) {
      toast.error('Google did not return an ID token');
      return;
    }
    (async () => {
      setBusy(true);
      try {
        await onSuccess?.(idToken, referralCode);
      } finally {
        setBusy(false);
      }
    })();
  }, [response, onSuccess, referralCode]);

  if (!clientId) return null;

  return (
    <Pressable
      disabled={!request || busy}
      onPress={() => promptAsync()}
      style={({ pressed }) => [
        styles.btn,
        (pressed || busy || !request) && styles.btnDisabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={colors.primary} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnDisabled: { opacity: 0.55 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
});
