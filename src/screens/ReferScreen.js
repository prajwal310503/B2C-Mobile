import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import { authAPI } from '../services/api';
import { toast } from '../store/toastStore';
import { colors, formatPrice, gradients, radius, shadows } from '../theme';

const STEPS = [
  { icon: 'share-social-outline', title: 'Share your code', note: 'Send it to friends and family' },
  { icon: 'bag-check-outline', title: 'They shop', note: 'Your friend places their first order' },
  { icon: 'wallet-outline', title: 'You earn', note: 'Reward credits to your wallet' },
];

export default function ReferScreen() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutBusy, setPayoutBusy] = useState(false);

  const reload = () =>
    authAPI
      .getReferral()
      .then(({ data }) => setInfo(data.data))
      .catch(() => setInfo(null));

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const copyCode = async () => {
    if (!info?.referralCode) return;
    await Clipboard.setStringAsync(info.referralCode);
    toast.success('Referral code copied');
  };

  const share = () => {
    if (!info) return;
    Share.share({
      message: `Shop certified fine jewellery at Luxury Jewellery. Use my code ${info.referralCode} — ${info.shareLink}`,
    }).catch(() => {});
  };

  const requestPayout = async () => {
    setPayoutBusy(true);
    try {
      await authAPI.requestReferralPayout({ method: 'wallet' });
      toast.success('Payout requested');
      await reload();
    } catch (error) {
      toast.error(error?.message || 'Could not request payout');
    } finally {
      setPayoutBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Refer & Earn" />
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (!info) {
    return (
      <Screen>
        <AppHeader title="Refer & Earn" />
        <View style={styles.center}>
          <Text style={styles.missing}>Referral details are unavailable right now.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Refer & Earn" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, shadows.md]}
        >
          <Text style={styles.heroEyebrow}>Your reward wallet</Text>
          <Text style={styles.heroAmount}>{formatPrice(info.referralBalance || 0)}</Text>
          <Text style={styles.heroNote}>
            Earn {formatPrice(info.defaultRewardAmount || 500)} for every friend who orders.
          </Text>

          <Pressable onPress={copyCode} style={styles.codeBox}>
            <View>
              <Text style={styles.codeLabel}>Your code</Text>
              <Text style={styles.codeValue}>{info.referralCode}</Text>
            </View>
            <Ionicons name="copy-outline" size={19} color={colors.champagne} />
          </Pressable>
        </LinearGradient>

        <View style={styles.statRow}>
          <View style={[styles.stat, shadows.xs]}>
            <Text style={styles.statValue}>{info.referredCount || 0}</Text>
            <Text style={styles.statLabel}>Friends joined</Text>
          </View>
          <View style={[styles.stat, shadows.xs]}>
            <Text style={styles.statValue}>{formatPrice(info.pendingTotal || 0)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.stat, shadows.xs]}>
            <Text style={styles.statValue}>{formatPrice(info.eligibleTotal || 0)}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <Button label="Share invite" icon="share-social-outline" onPress={share} full />
        {(info.eligibleTotal || 0) > 0 ? (
          <Button
            label={`Request payout · ${formatPrice(info.eligibleTotal)}`}
            variant="outline"
            icon="wallet-outline"
            loading={payoutBusy}
            onPress={requestPayout}
            full
          />
        ) : null}

        <View style={[styles.card, shadows.xs]}>
          <Text style={styles.cardTitle}>How it works</Text>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={s.icon} size={17} color={colors.goldDark} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>
                  {i + 1}. {s.title}
                </Text>
                <Text style={styles.stepNote}>{s.note}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.fineprint}>{info.note}</Text>
        </View>

        {info.rewards?.length ? (
          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardTitle}>Reward history</Text>
            {info.rewards.slice(0, 10).map((r) => (
              <View key={r._id} style={styles.rewardRow}>
                <View style={styles.flex}>
                  <Text style={styles.rewardOrder}>{r.orderNumber || 'Order'}</Text>
                  <Text style={styles.rewardDate}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.rewardRight}>
                  <Text style={styles.rewardAmount}>{formatPrice(r.amount)}</Text>
                  <Text
                    style={[
                      styles.rewardStatus,
                      r.status === 'eligible' || r.status === 'credited'
                        ? styles.rewardStatusOk
                        : null,
                    ]}
                  >
                    {r.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { fontSize: 14, color: colors.textMuted },
  scroll: { padding: 16, gap: 14, paddingBottom: 30 },
  hero: { padding: 22, borderRadius: radius.card, gap: 6 },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
  },
  heroAmount: { fontSize: 32, fontWeight: '800', color: colors.champagne, letterSpacing: -0.8 },
  heroNote: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 18 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  codeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.4 },
  codeValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 3,
    marginTop: 3,
  },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textFaint, letterSpacing: 0.3 },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  stepNote: { fontSize: 11.5, color: colors.textMuted },
  fineprint: { fontSize: 11, color: colors.textFaint, lineHeight: 16 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rewardOrder: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  rewardDate: { fontSize: 10.5, color: colors.textFaint, marginTop: 2 },
  rewardRight: { alignItems: 'flex-end', gap: 2 },
  rewardAmount: { fontSize: 13.5, fontWeight: '800', color: colors.primary },
  rewardStatus: { fontSize: 10, fontWeight: '700', color: colors.warning, textTransform: 'capitalize' },
  rewardStatusOk: { color: colors.successDark },
});
