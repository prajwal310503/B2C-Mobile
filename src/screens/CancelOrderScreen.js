import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import { orderAPI } from '../services/api';
import { toast } from '../store/toastStore';
import { colors, formatPrice, radius, shadows } from '../theme';

const CANCEL_FEE_PCT = 10;
const WINDOW_HOURS = 24;

function hoursLeft(createdAt) {
  const end = new Date(createdAt).getTime() + WINDOW_HOURS * 60 * 60 * 1000;
  return Math.max(0, (end - Date.now()) / (60 * 60 * 1000));
}

export default function CancelOrderScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    orderAPI
      .getById(params.id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const remainingHrs = useMemo(() => (order?.createdAt ? hoursLeft(order.createdAt) : 0), [order]);
  const withinWindow = remainingHrs > 0;
  const productValue = Number(order?.subtotal) || Number(order?.total) || 0;
  const feeAmount = Math.round((productValue * CANCEL_FEE_PCT) / 100);
  const refundAmount = Math.max(0, productValue - feeAmount);
  const alreadyRequested = !!order?.cancellationRequest;
  const blockedStatus = ['shipped', 'delivered', 'cancelled', 'returned', 'refunded'].includes(
    order?.status
  );
  const canSubmit =
    order && withinWindow && !alreadyRequested && !blockedStatus && reason.trim().length >= 5 && agree;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await orderAPI.requestCancel(order._id, { reason: reason.trim(), acknowledgeFee: true });
      toast.success('Cancellation request submitted');
      navigation.replace('OrderDetail', { id: order._id });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Could not submit cancellation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Cancel order" showBack />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Cancel order" showBack />
        <View style={styles.center}>
          <Text style={styles.missing}>Order not found</Text>
          <Button label="Go back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Cancel order" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>CANCELLATION</Text>
          <Text style={styles.title}>Request Cancellation</Text>
          <Text style={styles.orderNo}>Order #{order.orderNumber}</Text>

          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardLabel}>24-HOUR WINDOW</Text>
            <Text style={styles.cardTitle}>Cancel within 24 hours of ordering</Text>
            <Text style={styles.cardBody}>
              You can submit a cancellation request within 24 hours of placing the order.
            </Text>
            {withinWindow && !blockedStatus ? (
              <Text style={styles.ok}>
                Time left:{' '}
                {remainingHrs >= 1
                  ? `${Math.floor(remainingHrs)}h ${Math.round((remainingHrs % 1) * 60)}m`
                  : `${Math.round(remainingHrs * 60)} minutes`}
              </Text>
            ) : (
              <Text style={styles.bad}>Cancellation window has closed for this order.</Text>
            )}
          </View>

          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardLabel}>BANK TRANSFER FEE</Text>
            <Text style={styles.cardTitle}>10% of product value will be cut</Text>
            <Text style={styles.cardBody}>
              On approved cancellation, 10% of the product value is deducted for bank transfer
              processing.
            </Text>
          </View>

          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardTitle}>Estimated refund</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Product value</Text>
              <Text style={styles.rowValue}>{formatPrice(productValue)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.danger || '#dc2626' }]}>
                Fee ({CANCEL_FEE_PCT}%)
              </Text>
              <Text style={[styles.rowValue, { color: colors.danger || '#dc2626' }]}>
                −{formatPrice(feeAmount)}
              </Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Estimated refund</Text>
              <Text style={styles.totalValue}>{formatPrice(refundAmount)}</Text>
            </View>
          </View>

          {alreadyRequested ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                A cancellation request is already {order.cancellationRequest?.status || 'pending'}.
              </Text>
            </View>
          ) : null}

          {!alreadyRequested && !blockedStatus && withinWindow ? (
            <View style={[styles.card, shadows.xs]}>
              <Text style={styles.cardTitle}>Reason for cancellation</Text>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Tell us why you want to cancel (min. 5 characters)"
                placeholderTextColor={colors.textMuted}
                value={reason}
                onChangeText={setReason}
                maxLength={500}
              />
              <Pressable style={styles.checkRow} onPress={() => setAgree((v) => !v)}>
                <View style={[styles.checkbox, agree && styles.checkboxOn]}>
                  {agree ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.checkText}>
                  I understand cancellation is allowed within 24 hours, and 10% of product value will
                  be deducted for bank transfer refunds.
                </Text>
              </Pressable>
              <Button
                label={submitting ? 'Submitting…' : 'Submit cancellation request'}
                onPress={submit}
                disabled={!canSubmit || submitting}
                loading={submitting}
                full
              />
              <View style={{ height: 10 }} />
              <Button
                label="Keep order"
                variant="outline"
                onPress={() => navigation.goBack()}
                full
              />
            </View>
          ) : null}

          {!withinWindow && !alreadyRequested && !blockedStatus ? (
            <Button label="Contact support" variant="outline" onPress={() => navigation.navigate('Support')} full />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  missing: { color: colors.textMuted, fontSize: 14 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold || '#C9A84C',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text || '#1f2937',
    fontFamily: undefined,
  },
  orderNo: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  card: {
    backgroundColor: colors.white || '#fff',
    borderRadius: radius?.lg || 14,
    padding: 16,
    gap: 6,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.gold || '#C9A84C',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text || '#111' },
  cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  ok: { marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.primary },
  bad: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#dc2626' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 13, color: colors.text || '#111', fontWeight: '500' },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: colors.text || '#111' },
  totalValue: { fontSize: 14, fontWeight: '700', color: colors.primary },
  banner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerText: { fontSize: 13, color: '#92400e' },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.text || '#111',
    backgroundColor: '#fafafa',
    marginTop: 4,
    marginBottom: 10,
  },
  checkRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
});
