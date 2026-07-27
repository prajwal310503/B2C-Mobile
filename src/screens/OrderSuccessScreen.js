import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import { colors, formatPrice, gradients, radius, shadows } from '../theme';

export default function OrderSuccessScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { orderId, orderGroupId, partial, amount } = params;

  const scale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, fade]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient colors={gradients.gold} style={[styles.badge, shadows.gold]}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.textCol, { opacity: fade }]}>
          <Text style={styles.eyebrow}>Thank you</Text>
          <Text style={styles.title}>Order Confirmed</Text>
          <Text style={styles.message}>
            {partial
              ? 'Your order is confirmed. Pay the remaining 50% from My Orders to start dispatch.'
              : 'Your order is confirmed and our atelier is preparing it for dispatch.'}
          </Text>
        </Animated.View>

        <View style={[styles.card, shadows.sm]}>
          {orderGroupId ? (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Order group</Text>
              <Text style={styles.cardValue}>{orderGroupId}</Text>
            </View>
          ) : null}
          {amount ? (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Amount paid</Text>
              <Text style={styles.cardValueStrong}>{formatPrice(amount)}</Text>
            </View>
          ) : null}
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Delivery</Text>
            <Text style={styles.cardValue}>Insured & tracked</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {orderId ? (
            <Button
              label="View order"
              icon="receipt-outline"
              onPress={() => navigation.replace('OrderDetail', { id: orderId })}
              full
            />
          ) : null}
          <Button
            label="Continue shopping"
            variant="outline"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
            full
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 20 },
  badge: {
    width: 108,
    height: 108,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { alignItems: 'center', gap: 8 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  card: {
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 11,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardLabel: { fontSize: 12.5, color: colors.textMuted },
  cardValue: { fontSize: 12.5, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right' },
  cardValueStrong: { fontSize: 15, fontWeight: '800', color: colors.primary },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
});
