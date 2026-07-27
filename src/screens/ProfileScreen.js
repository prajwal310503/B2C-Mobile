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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { colors, gradients, radius, shadows } from '../theme';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Photo access is needed to change your avatar');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) setAvatar(result.assets[0]);
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSavingProfile(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      if (phone) form.append('phone', phone);
      if (avatar) {
        form.append('avatar', {
          uri: avatar.uri,
          name: avatar.fileName || 'avatar.jpg',
          type: avatar.mimeType || 'image/jpeg',
        });
      }
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.data?.user || data.data);
      setAvatar(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    const errors = {};
    if (!pw.currentPassword) errors.currentPassword = 'Current password is required';
    if (pw.newPassword.length < 6) errors.newPassword = 'Minimum 6 characters';
    if (pw.newPassword !== pw.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPw(true);
    try {
      await authAPI.updatePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error(error?.message || 'Could not update password');
    } finally {
      setSavingPw(false);
    }
  };

  const avatarUri = avatar?.uri || user?.avatar;

  return (
    <Screen>
      <AppHeader title="My Profile" subtitle={user?.email} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={70}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.avatarRow}>
              <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <LinearGradient colors={gradients.primary} style={styles.avatar}>
                    <Text style={styles.avatarInitial}>
                      {(user?.name || 'G')[0].toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.avatarEdit}>
                  <Ionicons name="camera" size={13} color={colors.white} />
                </View>
              </Pressable>
              <View style={styles.avatarText}>
                <Text style={styles.avatarName}>{user?.name || 'Guest'}</Text>
                <Text style={styles.avatarHint}>Tap the photo to change it</Text>
              </View>
            </View>

            <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
            <Field
              label="Phone"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              keyboardType="number-pad"
            />
            <View style={styles.readOnly}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{user?.email}</Text>
            </View>

            <Button label="Save changes" loading={savingProfile} onPress={saveProfile} full />
          </View>

          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.cardTitle}>Change password</Text>
            <Field
              label="Current password"
              value={pw.currentPassword}
              onChangeText={(t) => setPw((p) => ({ ...p, currentPassword: t }))}
              placeholder="••••••••"
              secure
              error={pwErrors.currentPassword}
            />
            <Field
              label="New password"
              value={pw.newPassword}
              onChangeText={(t) => setPw((p) => ({ ...p, newPassword: t }))}
              placeholder="At least 6 characters"
              secure
              error={pwErrors.newPassword}
            />
            <Field
              label="Confirm new password"
              value={pw.confirmPassword}
              onChangeText={(t) => setPw((p) => ({ ...p, confirmPassword: t }))}
              placeholder="Repeat new password"
              secure
              error={pwErrors.confirmPassword}
            />
            <Button
              label="Update password"
              variant="outline"
              loading={savingPw}
              onPress={savePassword}
              full
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 36 },
  card: {
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '800', color: colors.white },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { flex: 1, gap: 3 },
  avatarName: { fontSize: 16, fontWeight: '700', color: colors.text },
  avatarHint: { fontSize: 11.5, color: colors.textFaint },
  readOnly: {
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.primary700,
  },
  readOnlyValue: { fontSize: 14, color: colors.textMuted },
});
