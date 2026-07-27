import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import { orderAPI } from '../services/api';
import { colors, formatPrice, radius, shadows } from '../theme';

export const STATUS_STYLES = {
  pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  confirmed: { bg: '#e0f2fe', color: '#0369a1', label: 'Confirmed' },
  processing: { bg: '#ede9fe', color: '#6d28d9', label: 'Processing' },
  shipped: { bg: '#dbeafe', color: '#1d4ed8', label: 'Shipped' },
  delivered: { bg: '#dcfce7', color: '#15803d', label: 'Delivered' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  returned: { bg: '#f3f4f6', color: '#4b5563', label: 'Returned' },
  refunded: { bg: '#f3f4f6', color: '#4b5563', label: 'Refunded' },
};

export function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

function OrderCard({ order, onPress }) {
  const firstItem = order.items?.[0];
  const extra = (order.items?.length || 0) - 1;
  const placed = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.xs, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHead}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber || 'Order'}</Text>
          <Text style={styles.orderDate}>{placed}</Text>
        </View>
        <StatusPill status={order.status} />
      </View>

      <View style={styles.cardBody}>
        {firstItem?.image ? (
          <Image source={{ uri: firstItem.image }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="diamond-outline" size={20} color={colors.textFaint} />
          </View>
        )}
        <View style={styles.itemText}>
          <Text numberOfLines={2} style={styles.itemTitle}>
            {firstItem?.title || 'Order items'}
          </Text>
          {extra > 0 ? <Text style={styles.itemExtra}>+{extra} more item{extra === 1 ? '' : 's'}</Text> : null}
        </View>
      </View>

      <View style={styles.cardFoot}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {order.payment?.status === 'partial' ? (
          <View style={styles.partialTag}>
            <Ionicons name="alert-circle-outline" size={12} color={colors.warning} />
            <Text style={styles.partialText}>Balance due</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      orderAPI
        .getMyOrders({ limit: 30 })
        .then(({ data }) => {
          if (!cancelled) setOrders(data.data || []);
        })
        .catch(() => {
          if (!cancelled) setOrders([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <Screen>
      <AppHeader title="My Orders" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderDetail', { id: item._id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              message="When you place an order it will appear here with live tracking."
              actionLabel="Start shopping"
              onAction={() => navigation.navigate('Tabs', { screen: 'Shop' })}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 12, paddingBottom: 30 },
  card: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardPressed: { backgroundColor: colors.primary50 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderNumber: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  orderDate: { fontSize: 11.5, color: colors.textFaint, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  cardBody: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.primary50 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 },
  itemExtra: { fontSize: 11.5, color: colors.textFaint },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  total: { flex: 1, fontSize: 15.5, fontWeight: '800', color: colors.primary },
  partialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.warningSoft,
  },
  partialText: { fontSize: 10.5, fontWeight: '700', color: colors.warning },
});
