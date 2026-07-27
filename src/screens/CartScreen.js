import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { colors, formatPrice, gradients, radius, shadows } from '../theme';

function CartRow({ item, onQty, onRemove, onPress }) {
  const { product, quantity } = item;
  const uri = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url;
  const price = product.discountedPrice ?? product.price;
  const outOfStock = (Number(product.stock) || 0) <= 0;
  const selectionText = item.selections
    ? Object.values(item.selections).filter(Boolean).join(' · ')
    : null;

  return (
    <View style={[styles.row, shadows.xs]}>
      <Pressable onPress={onPress}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={gradients.card[0]} style={[styles.thumb, styles.center]}>
            <Ionicons name="diamond-outline" size={22} color="rgba(201,168,76,0.7)" />
          </LinearGradient>
        )}
      </Pressable>

      <View style={styles.rowBody}>
        <Pressable onPress={onPress}>
          <Text numberOfLines={2} style={styles.rowTitle}>
            {product.title}
          </Text>
        </Pressable>
        {selectionText ? <Text style={styles.rowMeta}>{selectionText}</Text> : null}
        {outOfStock ? <Text style={styles.rowOos}>Out of stock</Text> : null}

        <View style={styles.rowFooter}>
          <View style={styles.stepper}>
            <Pressable onPress={() => onQty(quantity - 1)} hitSlop={6} style={styles.stepBtn}>
              <Ionicons name="remove" size={15} color={colors.primary} />
            </Pressable>
            <Text style={styles.stepValue}>{quantity}</Text>
            <Pressable onPress={() => onQty(quantity + 1)} hitSlop={6} style={styles.stepBtn}>
              <Ionicons name="add" size={15} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.rowPrice}>{formatPrice(price * quantity)}</Text>
        </View>
      </View>

      <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={17} color={colors.textFaint} />
      </Pressable>
    </View>
  );
}

export default function CartScreen() {
  const navigation = useNavigation();
  const { items, updateQuantity, removeItem, getSubtotal, getShipping, getTotal, hasOutOfStock } =
    useCartStore();
  const token = useAuthStore((s) => s.token);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();

  const goCheckout = () => {
    if (hasOutOfStock()) return;
    if (!token) {
      navigation.navigate('Login', { redirect: 'Checkout' });
      return;
    }
    navigation.navigate('Checkout');
  };

  if (!items.length) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <EmptyState
          icon="bag-handle-outline"
          title="Your cart is empty"
          message="Add a few pieces you love and they'll show up here."
          actionLabel="Start shopping"
          onAction={() => navigation.navigate('Tabs', { screen: 'Shop' })}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
        <Text style={styles.headerCount}>
          {items.length} item{items.length === 1 ? '' : 's'}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CartRow
            item={item}
            onQty={(q) => updateQuantity(item.key, q)}
            onRemove={() => removeItem(item.key)}
            onPress={() =>
              navigation.navigate('Product', {
                slug: item.product.slug || item.product._id,
                preview: item.product,
              })
            }
          />
        )}
        ListFooterComponent={
          <View style={[styles.summary, shadows.sm]}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, styles.free]}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        }
      />

      <View style={styles.bar}>
        <View>
          <Text style={styles.barLabel}>Total</Text>
          <Text style={styles.barValue}>{formatPrice(total)}</Text>
        </View>
        <Button
          label={hasOutOfStock() ? 'Remove out-of-stock items' : 'Checkout'}
          iconRight={hasOutOfStock() ? undefined : 'arrow-forward'}
          disabled={hasOutOfStock()}
          onPress={goCheckout}
          style={styles.barBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerCount: { fontSize: 12.5, color: colors.textMuted },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 11,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.primary50 },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 18, paddingRight: 18 },
  rowMeta: { fontSize: 11, color: colors.textFaint },
  rowOos: { fontSize: 11, fontWeight: '700', color: colors.danger },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  stepBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 13, fontWeight: '700', color: colors.text, minWidth: 14, textAlign: 'center' },
  rowPrice: { fontSize: 15, fontWeight: '800', color: colors.primary },
  removeBtn: { position: 'absolute', top: 10, right: 10, padding: 4 },
  summary: {
    marginTop: 6,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 11,
  },
  summaryTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: colors.textMuted },
  summaryValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  free: { color: colors.successDark, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  barLabel: { fontSize: 11, color: colors.textMuted },
  barValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  barBtn: { flex: 1, maxWidth: 220 },
});
