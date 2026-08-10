import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import { authAPI } from '../../services/api';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../config';
import { toast } from '../../store/toastStore';
import { colors, radius } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

/**
 * Google Sign-In via ID token (same credential the backend googleAuth verifies).
 *
 * IMPORTANT: Google rejects custom-scheme (app://) redirect URIs for "Web application"
 * OAuth clients. Standalone/production builds on Android & iOS must use a platform-specific
 * client id (created in Google Cloud Console against the app's package name + SHA-1 / bundle
 * id) — the Web client id is only used as a fallback for Expo Go / web.
 */
export default function GoogleSignInButton({ onSuccess, referralCode, label = 'Continue with Google' }) {
  const [ids, setIds] = useState({
    webClientId: GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: GOOGLE_IOS_CLIENT_ID || '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ids.webClientId) return;
    let cancelled = false;
    authAPI
      .getGoogleClientId()
      .then(({ data }) => {
        if (cancelled) return;
        setIds({
          webClientId: data.data?.clientId || '',
          androidClientId: data.data?.androidClientId || '',
          iosClientId: data.data?.iosClientId || '',
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ids.webClientId]);

  // Native platforms need their platform-specific client id to be allowed to use a
  // custom-scheme redirect. Without one configured yet, we fall back to the web client id
  // so the button still renders — the sign-in attempt itself will show Google's error until
  // the Android/iOS OAuth client is created (see Backend .env.example for setup notes).
  const nativeClientId =
    (Platform.OS === 'android' ? ids.androidClientId : Platform.OS === 'ios' ? ids.iosClientId : '') ||
    ids.webClientId;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    ids.webClientId
      ? {
          clientId: ids.webClientId,
          webClientId: ids.webClientId,
          androidClientId: nativeClientId,
          iosClientId: nativeClientId,
        }
      : { clientId: 'placeholder.apps.googleusercontent.com' }
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) {
      if (response.params?.error) {
        toast.error('Google sign-in was cancelled or blocked');
      } else {
        toast.error('Google did not return an ID token');
      }
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

  if (!ids.webClientId) return null;

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
