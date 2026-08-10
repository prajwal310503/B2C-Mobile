import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Stars from '../components/ui/Stars';
import SectionHeader from '../components/ui/SectionHeader';
import ProductCard from '../components/product/ProductCard';
import { categoryAPI, pincodeAPI, productAPI, reviewAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import { toast } from '../store/toastStore';
import { colors, formatPrice, gradients, radius, shadows } from '../theme';
import { reverseGeocodePincode } from '../utils/geo';

const { width: SCREEN_W } = Dimensions.get('window');
const GALLERY_H = Math.round(SCREEN_W * 1.02);
const RELATED_W = Math.round(SCREEN_W * 0.44);

function Chip({ label, active, onPress, wide = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, wide && styles.chipWide, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.accordion}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.accordionHead}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={17}
          color={colors.textMuted}
        />
      </Pressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

function SpecRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function Gallery({ images, title }) {
  const [index, setIndex] = useState(0);
  const media = images?.length ? images : [{ url: null }];

  return (
    <View>
      <FlatList
        data={media}
        keyExtractor={(item, i) => String(item.url || i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
        }
        renderItem={({ item }) =>
          item.url ? (
            <Image
              source={{ uri: item.url }}
              style={styles.galleryImage}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <LinearGradient colors={gradients.card[0]} style={[styles.galleryImage, styles.center]}>
              <Ionicons name="diamond-outline" size={54} color="rgba(201,168,76,0.6)" />
              <Text style={styles.galleryFallbackText}>{title}</Text>
            </LinearGradient>
          )
        }
      />
      {media.length > 1 ? (
        <View style={styles.galleryDots}>
          <Text style={styles.galleryCounter}>
            {index + 1} / {media.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ProductScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params = {} } = useRoute();
  const { slug, preview } = params;

  const [product, setProduct] = useState(preview || null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [length, setLength] = useState('');
  const [stoneColor, setStoneColor] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [locating, setLocating] = useState(false);
  const [browseCategories, setBrowseCategories] = useState([]);

  const addItem = useCartStore((s) => s.addItem);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const inWishlist = useWishlistStore((s) =>
    s.items.some((i) => String(i?._id) === String(product?._id))
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    productAPI
      .getBySlug(slug)
      .then(async ({ data }) => {
        if (cancelled) return;
        const full = data.data;
        setProduct(full);

        const [revRes, relRes] = await Promise.allSettled([
          reviewAPI.getProductReviews(full._id, { limit: 10 }),
          productAPI.getAll({ category: full.category?.slug, limit: 8 }),
        ]);
        if (cancelled) return;
        if (revRes.status === 'fulfilled') setReviews(revRes.value.data.data || []);
        if (relRes.status === 'fulfilled') {
          setRelated((relRes.value.data.data || []).filter((p) => p._id !== full._id).slice(0, 6));
        }
      })
      .catch(() => {
        if (!cancelled && !preview) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, preview]);

  useEffect(() => {
    categoryAPI
      .getAll({ parent: 'null' })
      .then(({ data }) => setBrowseCategories(data.data || []))
      .catch(() => {});
  }, []);

  const pricing = useMemo(() => {
    if (!product) return { price: 0, hasDiscount: false };
    const sale =
      (product.discountedPrice > 0 ? product.discountedPrice : null) ??
      (product.price > 0 ? product.price : null);
    return {
      price: sale ?? product.price,
      hasDiscount: product.discount > 0,
    };
  }, [product]);

  if (loading && !product) {
    return (
      <Screen edges={['top']}>
        <AppHeader title="Loading" />
        <ActivityIndicator color={colors.primary} style={styles.pageLoader} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen edges={['top']}>
        <AppHeader title="Not found" />
        <View style={styles.center}>
          <Text style={styles.notFound}>This piece is no longer available.</Text>
          <Button label="Back to shop" onPress={() => navigation.goBack()} style={styles.notFoundBtn} />
        </View>
      </Screen>
    );
  }

  const outOfStock = (Number(product.stock) || 0) <= 0;
  const needsSize = product.sizes?.enabled && product.sizes?.available?.length > 0;
  const needsLength = product.lengths?.enabled && product.lengths?.available?.length > 0;
  const needsColor = product.stoneColors?.length > 0;
  const breakup = product.priceBreakup || {};

  const buildSelections = () => {
    if (needsSize && !size) {
      toast.error('Please select a size');
      return null;
    }
    if (needsLength && !length) {
      toast.error('Please select a length');
      return null;
    }
    if (needsColor && !stoneColor) {
      toast.error('Please select a stone colour');
      return null;
    }
    const selections = {};
    if (size) selections.size = size;
    if (length) selections.length = `${length}"`;
    if (stoneColor) selections.stoneColor = stoneColor;
    return Object.keys(selections).length ? selections : null;
  };

  const handleAddToCart = () => {
    const selections = buildSelections();
    if (selections === null && (needsSize || needsLength || needsColor)) return;
    addItem(product, qty, null, selections);
  };

  const handleBuyNow = () => {
    const selections = buildSelections();
    if (selections === null && (needsSize || needsLength || needsColor)) return;
    addItem(product, qty, null, selections);
    navigation.navigate('Checkout');
  };

  const handleShare = () =>
    Share.share({ message: `${product.title} — ${formatPrice(pricing.price)}` }).catch(() => {});

  const checkPincode = () => checkPincodeValue(pincode);

  const checkPincodeValue = async (pinValue) => {
    const pin = String(pinValue || '').trim();
    if (pin.length !== 6) {
      toast.error('Enter a valid 6-digit pincode');
      return;
    }
    setCheckingPin(true);
    try {
      const { data } = await pincodeAPI.check(pin);
      const payload = data?.data && typeof data.data === 'object' ? data.data : data;
      const available = payload?.available === true;
      setPincodeResult({
        ok: available,
        message:
          payload?.message ||
          (available ? 'Delivery available in your area' : 'Sorry, we do not deliver to this pincode yet'),
      });
    } catch (error) {
      setPincodeResult({ ok: false, message: error?.message || 'Delivery not available here' });
    } finally {
      setCheckingPin(false);
    }
  };

  const handleUseLocation = async () => {
    setLocating(true);
    setPincodeResult(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPincodeResult({ ok: false, message: 'Location permission denied. Enter your pincode instead.' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const pin = await reverseGeocodePincode(pos.coords.latitude, pos.coords.longitude);
      if (!pin) {
        setPincodeResult({
          ok: false,
          message: 'Could not detect a valid pincode for your location. Please enter it manually.',
        });
        return;
      }
      setPincode(pin);
      await checkPincodeValue(pin);
    } catch (error) {
      setPincodeResult({ ok: false, message: error?.message || 'Could not get your location. Enter pincode manually.' });
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <AppHeader
        title={product.category?.name || 'Product'}
        right={
          <View style={styles.headerActions}>
            <Pressable onPress={handleShare} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => toggleItem(product)} hitSlop={8} style={styles.headerBtn}>
              <Ionicons
                name={inWishlist ? 'heart' : 'heart-outline'}
                size={20}
                color={inWishlist ? '#ef4444' : colors.primary}
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        <Gallery images={product.images} title={product.title} />

        <View style={styles.body}>
          {product.store?.name || product.vendor?.storeName ? (
            <Pressable
              disabled={!product.store?.slug}
              onPress={() =>
                navigation.navigate('StoreDetail', {
                  slug: product.store.slug,
                  preview: product.store,
                })
              }
              hitSlop={6}
            >
              <Text style={styles.vendor}>
                {product.store?.name || product.vendor?.storeName}
                {product.store?.slug ? '  ›' : ''}
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.title}>{product.title}</Text>

          {product.rating > 0 ? (
            <View style={styles.ratingRow}>
              <Stars rating={product.rating} count={product.totalReviews} size={14} />
              {product.totalSold > 0 ? (
                <Text style={styles.sold}>· {product.totalSold} sold</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(pricing.price)}</Text>
            {pricing.hasDiscount ? (
              <>
                <Text style={styles.strike}>{formatPrice(product.price)}</Text>
                <View style={styles.offPill}>
                  <Text style={styles.offText}>{product.discount}% OFF</Text>
                </View>
              </>
            ) : null}
          </View>
          <Text style={styles.taxNote}>Inclusive of all taxes</Text>

          {product.shortDescription ? (
            <Text style={styles.shortDesc}>{product.shortDescription}</Text>
          ) : null}

          <View style={styles.trustRow}>
            {[
              { icon: 'shield-checkmark-outline', label: product.purity || 'Certified' },
              { icon: 'cube-outline', label: product.freeShipping ? 'Free shipping' : 'Insured shipping' },
              { icon: 'refresh-outline', label: '15-day returns' },
            ].map((t) => (
              <View key={t.label} style={styles.trustItem}>
                <Ionicons name={t.icon} size={15} color={colors.goldDark} />
                <Text style={styles.trustText}>{t.label}</Text>
              </View>
            ))}
          </View>

          {needsSize ? (
            <View style={styles.selectorBlock}>
              <Text style={styles.selectorLabel}>Select Size</Text>
              <View style={styles.chipRow}>
                {[...product.sizes.available].sort((a, b) => a - b).map((s) => (
                  <Chip
                    key={s}
                    label={String(s)}
                    active={size === s}
                    onPress={() => setSize(s)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {needsLength ? (
            <View style={styles.selectorBlock}>
              <Text style={styles.selectorLabel}>Select Length</Text>
              <View style={styles.chipRow}>
                {[...product.lengths.available].sort((a, b) => a - b).map((l) => (
                  <Chip
                    key={l}
                    label={`${l}"`}
                    active={length === l}
                    onPress={() => setLength(l)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {needsColor ? (
            <View style={styles.selectorBlock}>
              <Text style={styles.selectorLabel}>Stone Colour</Text>
              <View style={styles.chipRow}>
                {product.stoneColors.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    wide
                    active={stoneColor === c}
                    onPress={() => setStoneColor(c)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
                <Ionicons name="remove" size={17} color={colors.primary} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable
                onPress={() => setQty((q) => Math.min(Number(product.stock) || 1, q + 1))}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={17} color={colors.primary} />
              </Pressable>
              {!outOfStock && Number(product.stock) <= 5 ? (
                <Text style={styles.lowStock}>Only {product.stock} left</Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.pinCard, shadows.xs]}>
            <View style={styles.pinHeadRow}>
              <View style={styles.pinHead}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={styles.pinTitle}>Check delivery</Text>
              </View>
              <Pressable
                onPress={handleUseLocation}
                disabled={locating || checkingPin}
                hitSlop={6}
                style={styles.pinLocateBtn}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="navigate-outline" size={13} color={colors.primary} />
                )}
                <Text style={styles.pinLocateText}>{locating ? 'Detecting…' : 'Locate me'}</Text>
              </Pressable>
            </View>
            <View style={styles.pinRow}>
              <TextInput
                value={pincode}
                onChangeText={(t) => {
                  setPincode(t.replace(/[^0-9]/g, '').slice(0, 6));
                  setPincodeResult(null);
                }}
                placeholder="Enter pincode"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                style={styles.pinInput}
              />
              <Button
                label="Check"
                size="sm"
                variant="outline"
                loading={checkingPin}
                onPress={checkPincode}
              />
            </View>
            {pincodeResult ? (
              <View style={styles.pinResult}>
                <Ionicons
                  name={pincodeResult.ok ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={pincodeResult.ok ? colors.successDark : colors.danger}
                />
                <Text
                  style={[
                    styles.pinResultText,
                    { color: pincodeResult.ok ? colors.successDark : colors.danger },
                  ]}
                >
                  {pincodeResult.message}
                </Text>
              </View>
            ) : null}
          </View>

          {breakup.metalType || breakup.grossWeight || breakup.makingCharges ? (
            <Accordion title="Price Breakup">
              <SpecRow label="Metal" value={breakup.metalType} />
              <SpecRow
                label="Gross weight"
                value={breakup.grossWeight ? `${breakup.grossWeight} g` : null}
              />
              <SpecRow label="Net weight" value={breakup.netWeight ? `${breakup.netWeight} g` : null} />
              <SpecRow
                label="Metal rate"
                value={breakup.metalRate ? `${formatPrice(breakup.metalRate)} / g` : null}
              />
              <SpecRow
                label="Metal amount"
                value={breakup.metalAmount ? formatPrice(breakup.metalAmount) : null}
              />
              <SpecRow label="Diamond pieces" value={breakup.diamondPieces} />
              <SpecRow
                label="Diamond carat"
                value={breakup.diamondCarat ? `${breakup.diamondCarat} ct` : null}
              />
              <SpecRow label="Clarity" value={breakup.diamondClarity} />
              <SpecRow label="Shape" value={breakup.diamondCut} />
              <SpecRow label="Diamond color" value={breakup.diamondColor} />
              <SpecRow
                label="Diamond amount"
                value={breakup.diamondAmount ? formatPrice(breakup.diamondAmount) : null}
              />
              <SpecRow
                label="Making charges"
                value={breakup.makingCharges ? formatPrice(breakup.makingCharges) : null}
              />
              <SpecRow label="GST" value={breakup.gstPct ? `${breakup.gstPct}%` : null} />
              {breakup.totalSavings ? (
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsText}>
                    You save {formatPrice(breakup.totalSavings)}
                  </Text>
                </View>
              ) : null}
            </Accordion>
          ) : null}

          <Accordion title="Product Details" defaultOpen>
            <SpecRow label="SKU" value={product.sku} />
            <SpecRow label="Purity" value={product.purity} />
            <SpecRow
              label="Metal weight"
              value={product.metalWeight ? `${product.metalWeight} g` : null}
            />
            <SpecRow label="Diamond" value={product.diamondClarity} />
            <SpecRow
              label="Dimensions"
              value={
                product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height)
                  ? `${[product.dimensions.length, product.dimensions.width, product.dimensions.height].filter(Boolean).join(' × ')} ${product.dimensions.unit || 'mm'}`
                  : null
              }
            />
            <SpecRow label="Category" value={product.category?.name} />
            <SpecRow
              label="Delivery"
              value={
                product.deliveryDays || product.shippingDays
                  ? `${product.deliveryDays || product.shippingDays} days`
                  : null
              }
            />
            {product.description ? (
              <Text style={styles.description}>
                {String(product.description).replace(/<[^>]+>/g, '').trim()}
              </Text>
            ) : null}
          </Accordion>

          {product.certifications?.length || product.certificate?.certNumber ? (
            <Accordion title="Certifications">
              {product.certificate?.certNumber ? (
                <SpecRow
                  label={product.certificate.type || 'Certificate'}
                  value={product.certificate.certNumber}
                />
              ) : null}
              {(product.certifications || []).map((c, i) => (
                <SpecRow key={`${c.lab}-${i}`} label={c.lab} value={c.certNumber} />
              ))}
            </Accordion>
          ) : null}
        </View>

        <View style={styles.reviewBlock}>
          <SectionHeader
            eyebrow="Verified"
            title={`Reviews (${product.totalReviews || reviews.length})`}
            actionLabel="Write one"
            onAction={() =>
              navigation.navigate('WriteReview', {
                productId: product._id,
                productName: product.title,
                productImage: product.images?.[0]?.url || product.images?.[0],
              })
            }
          />
          {reviews.length ? (
            reviews.slice(0, 4).map((r) => (
              <View key={r._id} style={[styles.reviewCard, shadows.xs]}>
                <View style={styles.reviewHead}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewInitial}>
                      {(r.user?.name || 'A')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewName}>{r.user?.name || 'Anonymous'}</Text>
                    <Stars rating={r.rating} size={11} showCount={false} />
                  </View>
                </View>
                {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
                {r.comment ? (
                  <Text style={styles.reviewComment} numberOfLines={4}>
                    {r.comment}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={[styles.reviewCard, shadows.xs]}>
              <Text style={styles.reviewEmpty}>
                No reviews yet — be the first to share your experience with this piece.
              </Text>
            </View>
          )}
        </View>

        {related.length ? (
          <View style={styles.relatedBlock}>
            <SectionHeader eyebrow="You may also like" title="Similar Pieces" />
            <FlatList
              data={related}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRail}
              renderItem={({ item, index }) => (
                <ProductCard
                  product={item}
                  index={index}
                  width={RELATED_W}
                  compact
                  onPress={() =>
                    navigation.push('Product', { slug: item.slug || item._id, preview: item })
                  }
                />
              )}
            />
          </View>
        ) : null}

        {browseCategories.length ? (
          <View style={styles.exploreBlock}>
            <SectionHeader eyebrow="Browse" title="Explore Our Range" />
            <FlatList
              data={browseCategories}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.exploreRail}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate('Category', { slug: item.slug, name: item.name })}
                  style={styles.exploreItem}
                >
                  <View style={[styles.exploreCircle, shadows.sm]}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image?.url || item.image }}
                        style={styles.exploreImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <LinearGradient colors={[colors.champagne, colors.blush]} style={styles.exploreImage}>
                        <Ionicons name="diamond-outline" size={22} color={colors.goldDark} />
                      </LinearGradient>
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.exploreLabel}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label="Add to Cart"
          variant="outline"
          icon="bag-add-outline"
          disabled={outOfStock}
          onPress={handleAddToCart}
          style={styles.stickyBtn}
        />
        <Button
          label={outOfStock ? 'Out of Stock' : 'Buy Now'}
          disabled={outOfStock}
          onPress={handleBuyNow}
          style={styles.stickyBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1 },
  pageLoader: { marginTop: 60 },
  notFound: { fontSize: 14.5, color: colors.textMuted },
  notFoundBtn: { minWidth: 180 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  galleryImage: { width: SCREEN_W, height: GALLERY_H, backgroundColor: colors.primary50 },
  galleryFallbackText: {
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(90,65,63,0.5)',
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  galleryDots: { position: 'absolute', right: 16, bottom: 14 },
  galleryCounter: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: 'rgba(52,37,35,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  body: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
  vendor: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, lineHeight: 27, letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sold: { fontSize: 11.5, color: colors.textFaint },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  price: { fontSize: 25, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  strike: { fontSize: 15, color: colors.textFaint, textDecorationLine: 'line-through' },
  offPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: '#fee2e2',
  },
  offText: { fontSize: 11, fontWeight: '800', color: colors.danger },
  taxNote: { fontSize: 11.5, color: colors.textFaint, marginTop: -4 },
  shortDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginTop: 6 },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 5 },
  trustText: { fontSize: 10, fontWeight: '600', color: colors.text, textAlign: 'center' },
  selectorBlock: { marginTop: 16, gap: 9 },
  selectorLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary700,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 46,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { minWidth: 70 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  chipTextActive: { color: colors.white },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 22, textAlign: 'center' },
  lowStock: { fontSize: 11.5, fontWeight: '600', color: colors.warning, marginLeft: 4 },
  pinCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  pinHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pinTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  pinLocateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinLocateText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pinInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    fontSize: 14,
    color: colors.text,
  },
  pinResult: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pinResultText: { fontSize: 12, fontWeight: '600', flex: 1 },
  accordion: {
    marginTop: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accordionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  accordionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  accordionBody: {
    paddingHorizontal: 15,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 7,
  },
  specLabel: { fontSize: 12.5, color: colors.textMuted },
  specValue: { fontSize: 12.5, fontWeight: '600', color: colors.text, flexShrink: 1, textAlign: 'right' },
  savingsRow: {
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: '#ecfdf5',
  },
  savingsText: { fontSize: 12.5, fontWeight: '700', color: colors.successDark },
  description: { fontSize: 13.5, color: colors.textMuted, lineHeight: 21, marginTop: 10 },
  reviewBlock: { marginTop: 32 },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 7,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitial: { fontSize: 14, fontWeight: '800', color: colors.goldDark },
  reviewMeta: { gap: 3 },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  reviewComment: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  reviewEmpty: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
  relatedBlock: { marginTop: 32 },
  relatedRail: { paddingHorizontal: 16, gap: 12 },
  exploreBlock: { marginTop: 32 },
  exploreRail: { paddingHorizontal: 16, gap: 16 },
  exploreItem: { alignItems: 'center', width: 76, gap: 7 },
  exploreCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.champagne,
    borderWidth: 2,
    borderColor: colors.white,
  },
  exploreImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  exploreLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stickyBtn: { flex: 1 },
});
