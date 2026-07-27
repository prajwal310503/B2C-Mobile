import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import { authAPI } from '../services/api';
import { colors, radius } from '../theme';

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const token = params.token || '';
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing or invalid.');
      return;
    }
    authAPI
      .verifyEmail(token)
      .then(({ data }) => {
        setStatus('ok');
        setMessage(data?.message || 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || 'Could not verify email.');
      });
  }, [token]);

  return (
    <Screen>
      <AppHeader title="Verify Email" right={<View style={{ width: 40 }} />} />
      <View style={styles.wrap}>
        {status === 'loading' ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <>
            <View style={[styles.icon, status === 'ok' ? styles.iconOk : styles.iconErr]}>
              <Ionicons
                name={status === 'ok' ? 'checkmark' : 'alert'}
                size={28}
                color={colors.white}
              />
            </View>
            <Text style={styles.title}>{status === 'ok' ? 'Email verified' : 'Verification failed'}</Text>
            <Text style={styles.body}>{message}</Text>
            <Button
              label={status === 'ok' ? 'Continue' : 'Back to sign in'}
              onPress={() => navigation.replace('Login')}
              full
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconOk: { backgroundColor: colors.successDark || '#15803d' },
  iconErr: { backgroundColor: colors.danger || '#be123c' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 10 },
});
