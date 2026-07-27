import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { couponAPI, orderAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { colors, formatPrice, radius, shadows } from '../theme';

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

const PAYMENT_OPTIONS = [
  {
    key: 'full_payment',
    title: 'Full Payment',
    note: 'Pay 100% now',
    tag: '100%',
  },
  {
    key: 'partial_payment',
    title: 'Partial Payment',
    note: 'Pay 50% now, rest before dispatch',
    tag: '50%',
  },
];

function Card({ title, step, children }) {
  return (
    <View style={[styles.card, shadows.xs]}>
      <View style={styles.cardHead}>
        <View style={styles.stepDot}>
          <Text style={styles.stepDotText}>{step}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { items, getSubtotal, getShipping, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    fullName: user?.name || '',
    phone: user?.phone || '',
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSaved, setSelectedSaved] = useState(-1);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('full_payment');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [placing, setPlacing] = useState(false);

  // The offers endpoint is authenticated, so guests simply see no offer list.
  useEffect(() => {
    if (!token) return;
    couponAPI
      .getAvailable()
      .then(({ data }) => setAvailableCoupons(data.data || []))
      .catch(() => setAvailableCoupons([]));
  }, [token]);

  useEffect(() => {
    const list = user?.addresses || [];
    setSavedAddresses(list);
    if (list.length) {
      setSelectedSaved(0);
      setAddress({ ...EMPTY_ADDRESS, ...list[0] });
    }
  }, [user]);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = Math.max(0, subtotal + shipping - couponDiscount);
  const payNow = paymentMethod === 'partial_payment' ? Math.round(total * 0.5) : total;
  const payLater = Math.max(0, total - payNow);

  const setField = (key, value) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!address.fullName?.trim()) next.fullName = 'Required';
    if (!/^\d{10}$/.test(String(address.phone || '').replace(/\D/g, '')))
      next.phone = 'Enter a 10-digit number';
    if (!address.addressLine1?.trim()) next.addressLine1 = 'Required';
    if (!address.city?.trim()) next.city = 'Required';
    if (!address.state?.trim()) next.state = 'Required';
    if (!/^\d{6}$/.test(String(address.pincode || ''))) next.pincode = 'Enter a 6-digit pincode';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const { data } = await couponAPI.validate({
        code,
        subtotal,
        items: items.map((item) => {
          const price = item.product.discountedPrice ?? item.product.price ?? 0;
          const qty = item.quantity || 1;
          return {
            productId: item.product._id,
            categoryId: item.product.category?._id || item.product.category,
            lineTotal: price * qty,
            quantity: qty,
            price,
          };
        }),
      });
      const discount = data.data?.discount || 0;
      setCouponDiscount(discount);
      toast.success(`Coupon applied — you save ${formatPrice(discount)}`);
    } catch (error) {
      setCouponDiscount(0);
      toast.error(error?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const placeOrder = async () => {
    if (!items.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!validate()) {
      toast.error('Please complete the delivery address');
      return;
    }

    setPlacing(true);
    try {
      const orderItems = items.map((item) => ({
        product: item.product._id,
        title: item.product.title,
        sku: item.product.sku || '',
        image: item.product.images?.[0]?.url || '',
        price: item.product.discountedPrice ?? item.product.price,
        quantity: item.quantity,
        variantAttributes: item.variantAttributes || undefined,
        selections: item.selections || undefined,
      }));

      const { data } = await orderAPI.create({
        items: orderItems,
        shippingAddress: address,
        payment: { method: paymentMethod },
        couponCode: couponCode.trim() || undefined,
      });

      const result = data.data;
      const primaryId = result.primaryOrderId || result.orders?.[0]?._id;

      clearCart();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Tabs' },
          {
            name: 'OrderSuccess',
            params: {
              orderId: primaryId,
              orderGroupId: result.orderGroupId,
              partial: paymentMethod === 'partial_payment',
              amount: payNow,
            },
          },
        ],
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Checkout" right={<View style={styles.headerSpacer} />} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card step="1" title="Delivery Address">
            {savedAddresses.length ? (
              <View style={styles.savedRow}>
                {savedAddresses.map((a, i) => (
                  <Pressable
                    key={`${a.pincode}-${i}`}
                    onPress={() => {
                      setSelectedSaved(i);
                      setAddress({ ...EMPTY_ADDRESS, ...a });
                    }}
                    style={[styles.savedChip, selectedSaved === i && styles.savedChipActive]}
                  >
                    <Ionicons
                      name={selectedSaved === i ? 'radio-button-on' : 'radio-button-off'}
                      size={15}
                      color={selectedSaved === i ? colors.primary : colors.textFaint}
                    />
                    <Text numberOfLines={1} style={styles.savedChipText}>
                      {a.city || 'Saved'} · {a.pincode}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    setSelectedSaved(-1);
                    setAddress({
                      ...EMPTY_ADDRESS,
                      fullName: user?.name || '',
                      phone: user?.phone || '',
                    });
                  }}
                  style={[styles.savedChip, selectedSaved === -1 && styles.savedChipActive]}
                >
                  <Ionicons name="add" size={15} color={colors.primary} />
                  <Text style={styles.savedChipText}>New</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.form}>
              <Field
                label="Full name"
                value={address.fullName}
                onChangeText={(t) => setField('fullName', t)}
                placeholder="e.g. Priya Sharma"
                error={errors.fullName}
                icon="person-outline"
              />
              <Field
                label="Phone"
                value={String(address.phone || '')}
                onChangeText={(t) => setField('phone', t.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                error={errors.phone}
                icon="call-outline"
              />
              <Field
                label="Address line 1"
                value={address.addressLine1}
                onChangeText={(t) => setField('addressLine1', t)}
                placeholder="House / flat, street"
                error={errors.addressLine1}
                icon="home-outline"
              />
              <Field
                label="Address line 2 (optional)"
                value={address.addressLine2}
                onChangeText={(t) => setField('addressLine2', t)}
                placeholder="Landmark, area"
              />
              <View style={styles.formRow}>
                <View style={styles.flex}>
                  <Field
                    label="City"
                    value={address.city}
                    onChangeText={(t) => setField('city', t)}
                    placeholder="City"
                    error={errors.city}
                  />
                </View>
                <View style={styles.flex}>
                  <Field
                    label="State"
                    value={address.state}
                    onChangeText={(t) => setField('state', t)}
                    placeholder="State"
                    error={errors.state}
                  />
                </View>
              </View>
              <Field
                label="Pincode"
                value={String(address.pincode || '')}
                onChangeText={(t) => setField('pincode', t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="6-digit pincode"
                keyboardType="number-pad"
                error={errors.pincode}
                icon="location-outline"
              />
            </View>
          </Card>

          <Card step="2" title="Promo Code">
            <View style={styles.couponRow}>
              <TextInput
                value={couponCode}
                onChangeText={(t) => {
                  setCouponCode(t.toUpperCase());
                  setCouponDiscount(0);
                }}
                placeholder="Enter code"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="characters"
                style={styles.couponInput}
              />
              <Button
                label={couponDiscount > 0 ? 'Applied' : 'Apply'}
                size="sm"
                variant="outline"
                loading={applyingCoupon}
                disabled={!couponCode.trim() || couponDiscount > 0}
                onPress={applyCoupon}
              />
            </View>
            {couponDiscount > 0 ? (
              <View style={styles.couponSuccess}>
                <Ionicons name="checkmark-circle" size={14} color={colors.successDark} />
                <Text style={styles.couponSuccessText}>
                  You save {formatPrice(couponDiscount)}
                </Text>
              </View>
            ) : null}

            {availableCoupons.length ? (
              <View style={styles.offerList}>
                <Text style={styles.offerHead}>Available offers</Text>
                {availableCoupons.map((c) => {
                  const eligible = subtotal >= (c.minOrderAmount || 0);
                  return (
                    <Pressable
                      key={c._id || c.code}
                      disabled={!eligible}
                      onPress={() => {
                        setCouponCode(c.code);
                        setCouponDiscount(0);
                      }}
                      style={[styles.offerCard, !eligible && styles.offerCardDisabled]}
                    >
                      <View style={styles.offerCode}>
                        <Text style={styles.offerCodeText}>{c.code}</Text>
                      </View>
                      <View style={styles.offerText}>
                        <Text style={styles.offerTitle}>
                          {c.title ||
                            (c.type === 'percentage'
                              ? `${c.value}% off`
                              : c.type === 'free_shipping'
                                ? 'Free shipping'
                                : `${formatPrice(c.value)} off`)}
                        </Text>
                        <Text style={styles.offerNote}>
                          {eligible
                            ? c.description || 'Tap to fill this code'
                            : `Add ${formatPrice((c.minOrderAmount || 0) - subtotal)} more to use`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Card>

          <Card step="3" title="Payment">
            {PAYMENT_OPTIONS.map((option) => {
              const active = paymentMethod === option.key;
              const amount = option.key === 'partial_payment' ? Math.round(total * 0.5) : total;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setPaymentMethod(option.key)}
                  style={[styles.payOption, active && styles.payOptionActive]}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={19}
                    color={active ? colors.primary : colors.textFaint}
                  />
                  <View style={styles.flex}>
                    <Text style={styles.payTitle}>{option.title}</Text>
                    <Text style={styles.payNote}>
                      {option.note} — {formatPrice(amount)}
                    </Text>
                  </View>
                  <View style={styles.payTag}>
                    <Text style={styles.payTagText}>{option.tag}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>

          <View style={[styles.summary, shadows.xs]}>
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
            {couponDiscount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coupon discount</Text>
                <Text style={[styles.summaryValue, styles.free]}>
                  -{formatPrice(couponDiscount)}
                </Text>
              </View>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Order total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.payNowLabel}>
                Pay now ({paymentMethod === 'partial_payment' ? '50%' : '100%'})
              </Text>
              <Text style={styles.payNowValue}>{formatPrice(payNow)}</Text>
            </View>
            {payLater > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining later</Text>
                <Text style={styles.summaryValue}>{formatPrice(payLater)}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bar}>
          <View>
            <Text style={styles.barLabel}>Pay now</Text>
            <Text style={styles.barValue}>{formatPrice(payNow)}</Text>
          </View>
          <Button
            label="Place Order"
            iconRight="checkmark"
            loading={placing}
            onPress={placeOrder}
            style={styles.barBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerSpacer: { width: 38 },
  scroll: { padding: 16, gap: 14, paddingBottom: 24 },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { fontSize: 12, fontWeight: '800', color: colors.white },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  savedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  savedChipActive: { borderColor: colors.primary300, backgroundColor: colors.primary50 },
  savedChipText: { fontSize: 12, fontWeight: '600', color: colors.text, flexShrink: 1 },
  form: { gap: 12 },
  formRow: { flexDirection: 'row', gap: 12 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  couponInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.text,
  },
  couponSuccess: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  couponSuccessText: { fontSize: 12.5, fontWeight: '700', color: colors.successDark },
  offerList: { gap: 9, marginTop: 4 },
  offerHead: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary200,
    backgroundColor: colors.surfaceAlt,
  },
  offerCardDisabled: { opacity: 0.5 },
  offerCode: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.champagne,
  },
  offerCodeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: colors.primary900 },
  offerText: { flex: 1, gap: 2 },
  offerTitle: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  offerNote: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  payOptionActive: { borderColor: colors.primary300, backgroundColor: colors.primary50 },
  payTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  payNote: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  payTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
  },
  payTagText: { fontSize: 10.5, fontWeight: '800', color: colors.goldDark },
  summary: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  summaryTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: colors.textMuted },
  summaryValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  free: { color: colors.successDark, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  payNowLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },
  payNowValue: { fontSize: 14, fontWeight: '800', color: colors.primary },
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
  barBtn: { flex: 1, maxWidth: 210 },
});
