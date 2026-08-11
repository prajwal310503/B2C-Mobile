import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import { StatusPill } from './OrdersScreen';
import { orderAPI, TOKEN_KEY } from '../services/api';
import { API_BASE } from '../config';
import { toast } from '../store/toastStore';
import { colors, formatPrice, radius, shadows } from '../theme';

const TIMELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const TIMELINE_LABELS = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Being crafted',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

function Row({ label, value, strong }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);

  const load = () =>
    orderAPI
      .getById(params.id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => setOrder(null));

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const payRemaining = async () => {
    setPaying(true);
    try {
      await orderAPI.payRemaining(order._id);
      toast.success('Remaining amount paid');
      await load();
    } catch (error) {
      toast.error(error?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const requestCancel = () => {
    navigation.navigate('CancelOrder', { id: order._id });
  };

  const requestReturn = () => {
    Alert.prompt
      ? Alert.prompt(
          'Return request',
          'Why are you returning this order?',
          async (reason) => {
            if (!reason?.trim()) return;
            try {
              await orderAPI.requestReturn(order._id, { reason: reason.trim() });
              toast.success('Return requested');
              await load();
            } catch (error) {
              toast.error(error?.message || 'Could not request return');
            }
          },
          'plain-text'
        )
      : Alert.alert('Return request', 'Submit a return for this delivered order?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request return',
            onPress: async () => {
              try {
                await orderAPI.requestReturn(order._id, { reason: 'Requested from app' });
                toast.success('Return requested');
                await load();
              } catch (error) {
                toast.error(error?.message || 'Could not request return');
              }
            },
          },
        ]);
  };

  const downloadInvoice = async () => {
    setInvoiceBusy(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = `${API_BASE.replace(/\/$/, '')}/orders/${order._id}/invoice`;
      const dest = `${FileSystem.cacheDirectory}invoice-${order.orderNumber || order._id}.pdf`;
      const result = await FileSystem.downloadAsync(url, dest, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (result.status >= 400) throw new Error('Invoice download failed');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Order invoice' });
      } else {
        toast.success('Invoice saved');
      }
    } catch (error) {
      toast.error(error?.message || 'Could not download invoice');
    } finally {
      setInvoiceBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Order" />
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Order" />
        <View style={styles.center}>
          <Text style={styles.missing}>We couldn't load this order.</Text>
          <Button label="Go back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const isCancelled = ['cancelled', 'returned', 'refunded'].includes(order.status);
  const activeStep = TIMELINE.indexOf(order.status);
  const address = order.shippingAddress || {};
  const canCancel = ['pending', 'confirmed'].includes(order.status) && !order.cancellationRequest;
  const canReturn =
    ['delivered', 'shipped'].includes(order.status) && !order.returnRequest && !isCancelled;
  const needsBalance = order.payment?.status === 'partial';

  return (
    <Screen>
      <AppHeader title={order.orderNumber || 'Order'} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadows.xs]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Status</Text>
            <StatusPill status={order.status} />
          </View>

          {isCancelled ? (
            <Text style={styles.cancelledNote}>
              This order was {order.status}. Any eligible refund is processed within 5-7 days.
            </Text>
          ) : (
            <View style={styles.timeline}>
              {TIMELINE.map((step, i) => {
                const done = i <= activeStep;
                return (
                  <View key={step} style={styles.timelineRow}>
                    <View style={styles.timelineCol}>
                      <View style={[styles.node, done && styles.nodeDone]}>
                        {done ? <Ionicons name="checkmark" size={11} color={colors.white} /> : null}
                      </View>
                      {i < TIMELINE.length - 1 ? (
                        <View style={[styles.connector, i < activeStep && styles.connectorDone]} />
                      ) : null}
                    </View>
                    <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                      {TIMELINE_LABELS[step]}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {order.trackingNumber ? (
            <View style={styles.trackBox}>
              <Ionicons name="cube-outline" size={16} color={colors.primary} />
              <Text style={styles.trackText}>
                {order.courierName || 'Courier'} · {order.trackingNumber}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, shadows.xs]}>
          <Text style={styles.cardTitle}>Items</Text>
          {(order.items || []).map((item, i) => (
            <View key={`${item.product || i}`} style={styles.itemRow}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemThumb} contentFit="cover" />
              ) : (
                <View style={[styles.itemThumb, styles.itemThumbFallback]}>
                  <Ionicons name="diamond-outline" size={18} color={colors.textFaint} />
                </View>
              )}
              <View style={styles.itemText}>
                <Text numberOfLines={2} style={styles.itemTitle}>
                  {item.title}
                </Text>
                {item.selections ? (
                  <Text style={styles.itemMeta}>
                    {Object.values(item.selections).filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
                <Text style={styles.itemMeta}>Qty {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, shadows.xs]}>
          <Text style={styles.cardTitle}>Payment</Text>
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          <Row
            label="Shipping"
            value={order.shippingCost ? formatPrice(order.shippingCost) : 'FREE'}
          />
          {order.couponDiscount ? (
            <Row label={`Coupon ${order.couponCode || ''}`} value={`-${formatPrice(order.couponDiscount)}`} />
          ) : null}
          {order.tax ? <Row label="Tax" value={formatPrice(order.tax)} /> : null}
          <View style={styles.divider} />
          <Row label="Total" value={formatPrice(order.total)} strong />
          <Row label="Method" value={order.payment?.method?.replace(/_/g, ' ')} />
          <Row label="Payment status" value={order.payment?.status} />
        </View>

        <View style={[styles.card, shadows.xs]}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressName}>{address.fullName}</Text>
          <Text style={styles.addressText}>
            {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {address.phone ? <Text style={styles.addressText}>Phone: {address.phone}</Text> : null}
        </View>

        <View style={styles.actions}>
          {needsBalance ? (
            <Button
              label="Pay remaining amount"
              icon="card-outline"
              loading={paying}
              onPress={payRemaining}
              full
            />
          ) : null}
          <Button
            label="Download invoice"
            variant="outline"
            icon="document-outline"
            loading={invoiceBusy}
            onPress={downloadInvoice}
            full
          />
          {canCancel ? (
            <Button label="Request cancellation" variant="outline" onPress={requestCancel} full />
          ) : null}
          {canReturn ? (
            <Button label="Request return" variant="outline" onPress={requestReturn} full />
          ) : null}
          <Button
            label="Need help?"
            variant="ghost"
            icon="chatbubbles-outline"
            onPress={() => navigation.navigate('Support')}
            full
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  missing: { fontSize: 14, color: colors.textMuted },
  scroll: { padding: 16, gap: 14, paddingBottom: 30 },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  cancelledNote: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  timeline: { marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineCol: { alignItems: 'center', width: 18 },
  node: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  connector: { width: 2, flex: 1, minHeight: 22, backgroundColor: colors.border },
  connectorDone: { backgroundColor: colors.primary },
  timelineLabel: { fontSize: 13, color: colors.textFaint, paddingBottom: 18 },
  timelineLabelDone: { color: colors.text, fontWeight: '600' },
  trackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  trackText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  itemThumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.primary50 },
  itemThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 12.5, fontWeight: '600', color: colors.text, lineHeight: 17 },
  itemMeta: { fontSize: 11, color: colors.textFaint },
  itemPrice: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
  rowLabel: { fontSize: 12.5, color: colors.textMuted, textTransform: 'capitalize' },
  rowValue: { fontSize: 12.5, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  rowValueStrong: { fontSize: 16, fontWeight: '800', color: colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  addressName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  addressText: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  actions: { gap: 10 },
});
