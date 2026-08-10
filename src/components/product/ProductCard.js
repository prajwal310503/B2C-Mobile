import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Stars from '../ui/Stars';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { colors, formatPrice, gradients, radius, shadows } from '../../theme';

const METAL_SWATCHES = [
  { label: 'Yellow Gold', color: '#C9A84C' },
  { label: 'Rose Gold', color: '#B76E79' },
  { label: 'White Gold', color: '#d4d4d8' },
];

function Badge({ label, palette, icon }) {
  return (
    <LinearGradient
      colors={palette}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}
    >
      {icon ? <Ionicons name={icon} size={9} color={colors.white} /> : null}
      <Text style={styles.badgeText}>{label}</Text>
    </LinearGradient>
  );
}

// Every product card on screen rotates its badge in perfect unison — the index is
// derived from wall-clock time (not each card's own mount time), so they all flip
// at exactly the same moment without needing any shared state.
const BADGE_ROTATE_MS = 2600;
function useSyncedTick(intervalMs) {
  const [tick, setTick] = useState(() => Math.floor(Date.now() / intervalMs));
  useEffect(() => {
    let timeoutId;
    const scheduleNext = () => {
      const now = Date.now();
      const next = (Math.floor(now / intervalMs) + 1) * intervalMs;
      timeoutId = setTimeout(() => {
        setTick(Math.floor(Date.now() / intervalMs));
        scheduleNext();
      }, next - now);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [intervalMs]);
  return tick;
}

function RotatingBadge({ badges }) {
  const tick = useSyncedTick(BADGE_ROTATE_MS);
  const opacity = useRef(new Animated.Value(1)).current;
  const prevKey = useRef(null);
  const badge = badges.length ? badges[tick % badges.length] : null;

  useEffect(() => {
    if (!badge) return;
    if (prevKey.current === null) {
      prevKey.current = badge.key;
      return;
    }
    if (prevKey.current !== badge.key) {
      prevKey.current = badge.key;
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge?.key]);

  if (!badge) return null;
  return (
    <Animated.View style={[styles.rotatingBadge, { backgroundColor: badge.bg, opacity }]}>
      {badge.icon ? <Ionicons name={badge.icon} size={10} color={badge.color} /> : null}
      <Text style={[styles.rotatingBadgeText, { color: badge.color }]}>{badge.label}</Text>
    </Animated.View>
  );
}

function ProductCard({ product, onPress, width, index = 0, compact = false }) {
  const [swatch, setSwatch] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const inWishlist = useWishlistStore((s) => s.items.some((i) => String(i?._id) === String(product?._id)));

  const mounted = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(mounted, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index, 8) * 45,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const entrance = {
    opacity: mounted,
    transform: [
      { translateY: mounted.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
      { scale: mounted.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  const primary = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const salePrice =
    (product.discountedPrice > 0 ? product.discountedPrice : null) ??
    (product.price > 0 ? product.price : null);
  const price = salePrice ?? product.price;
  const hasDiscount = product.discount > 0;
  const outOfStock = (Number(product.stock) || 0) <= 0;
  const isFastDelivery = Number(product.deliveryDays) > 0 && Number(product.deliveryDays) <= 3;
  const fallback = gradients.card[index % gradients.card.length];
  const showImage = !!primary?.url && !imageFailed;

  const rotatingBadges = [
    hasDiscount && { key: 'discount', label: `${product.discount}% OFF`, bg: '#E11D48', color: colors.white },
    product.isBestSeller && { key: 'bestSeller', label: 'Best Seller', bg: '#B76E79', color: colors.white, icon: 'star' },
    product.isNewArrival && { key: 'newArrival', label: 'New Arrival', bg: '#5C8B6B', color: colors.white, icon: 'checkmark-circle' },
    isFastDelivery && { key: 'fastDelivery', label: 'Faster Delivery', bg: '#F0DFC0', color: '#5A413F', icon: 'flash' },
  ].filter(Boolean);

  const handleAddToCart = () => {
    if (outOfStock) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addItem(product, 1);
  };

  return (
    <Animated.View style={[{ width }, entrance]}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.sm,
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
    >
      <View style={[styles.imageWrap, { height: width }]}>
        {showImage ? (
          <Image
            source={{ uri: primary.url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={220}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <LinearGradient colors={fallback} style={[StyleSheet.absoluteFill, styles.fallback]}>
            <Ionicons name="diamond-outline" size={38} color="rgba(201,168,76,0.7)" />
            <Text style={styles.fallbackText}>{product.category?.name || 'Jewelry'}</Text>
          </LinearGradient>
        )}

        <View style={styles.badges}>
          {outOfStock ? (
            <Badge label="Out of Stock" palette={gradients.muted} />
          ) : (
            <RotatingBadge badges={rotatingBadges} />
          )}
        </View>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            toggleItem(product);
          }}
          hitSlop={8}
          style={styles.heart}
        >
          <Ionicons
            name={inWishlist ? 'heart' : 'heart-outline'}
            size={17}
            color={inWishlist ? '#ef4444' : colors.textMuted}
          />
        </Pressable>

        {!compact ? (
          <Pressable onPress={handleAddToCart} disabled={outOfStock} style={styles.cartBtnWrap}>
            <LinearGradient
              colors={outOfStock ? gradients.muted : gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cartBtn}
            >
              <Text style={styles.cartBtnText}>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        {product.vendor?.storeName ? (
          <Text numberOfLines={1} style={styles.vendor}>
            {product.vendor.storeName}
          </Text>
        ) : null}

        <Text numberOfLines={2} style={styles.title}>
          {product.title}
        </Text>

        {product.rating > 0 ? <Stars rating={product.rating} count={product.totalReviews} /> : null}

        {!compact ? (
          <View style={styles.swatchRow}>
            {METAL_SWATCHES.map((m, i) => (
              <Pressable
                key={m.label}
                onPress={() => setSwatch(i)}
                hitSlop={6}
                style={[
                  styles.swatch,
                  { backgroundColor: m.color },
                  i === swatch && styles.swatchActive,
                ]}
              />
            ))}
            <Text style={styles.swatchLabel}>{METAL_SWATCHES[swatch].label}</Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          {hasDiscount ? <Text style={styles.strike}>{formatPrice(product.price)}</Text> : null}
        </View>
        {hasDiscount ? (
          <Text style={styles.discountNote}>{product.discount}% off on making charges</Text>
        ) : null}
      </View>
    </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  imageWrap: { width: '100%', backgroundColor: colors.primary50 },
  fallback: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  fallbackText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(90,65,63,0.5)',
  },
  badges: { position: 'absolute', top: 8, left: 8, gap: 4, alignItems: 'flex-start' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.3 },
  rotatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  rotatingBadgeText: { fontSize: 10.5, fontWeight: '700' },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnWrap: { position: 'absolute', left: 8, right: 8, bottom: 8 },
  cartBtn: { height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cartBtnText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  body: { padding: 11, gap: 5 },
  vendor: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  title: { fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 18 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  swatch: {
    width: 11,
    height: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  swatchActive: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.xs,
  },
  swatchLabel: { fontSize: 9, color: colors.textFaint, marginLeft: 2 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 5,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: { fontSize: 15.5, fontWeight: '800', color: colors.primary },
  strike: { fontSize: 12.5, color: colors.textFaint, textDecorationLine: 'line-through' },
  discountNote: { fontSize: 11, fontWeight: '600', color: '#e53e3e' },
});

export default memo(ProductCard);
