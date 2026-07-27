import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Stars from '../components/ui/Stars';
import SectionHeader from '../components/ui/SectionHeader';
import ProductCard from '../components/product/ProductCard';
import { productAPI, storeAPI } from '../services/api';
import { colors, gradients, radius, shadows } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 12;
const CARD_W = (SCREEN_W - 32 - GAP) / 2;

export default function StoreDetailScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const [store, setStore] = useState(params.preview || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    storeAPI
      .getStoreBySlug(params.slug)
      .then(async ({ data }) => {
        if (cancelled) return;
        setStore(data.data);
        try {
          const res = await productAPI.getAll({ store: params.slug, limit: 12 });
          if (!cancelled) setProducts(res.data.data || []);
        } catch {
          // Product rail is optional.
        }
      })
      .catch(() => {
        if (!cancelled && !params.preview) setStore(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug, params.preview]);

  if (loading && !store) {
    return (
      <Screen>
        <AppHeader title="Boutique" />
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (!store) {
    return (
      <Screen>
        <AppHeader title="Boutique" />
        <View style={styles.center}>
          <Text style={styles.missing}>This boutique is unavailable.</Text>
          <Button label="Go back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const open = (url) => url && Linking.openURL(url).catch(() => {});

  return (
    <Screen>
      <AppHeader title={store.name} subtitle={store.city} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {store.banner || store.image ? (
            <Image
              source={{ uri: store.banner || store.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <LinearGradient colors={gradients.heroFallback} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(52,37,35,0.72)']}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>
              {`EXPERIENCE ${String(store.name).toUpperCase()}`}
            </Text>
            {store.tagline ? <Text style={styles.heroTagline}>{store.tagline}</Text> : null}
          </View>
        </View>

        <View style={[styles.headCard, shadows.sm]}>
          <View style={styles.headRow}>
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={styles.logo} contentFit="cover" />
            ) : (
              <LinearGradient colors={gradients.gold} style={styles.logo}>
                <Text style={styles.logoInitial}>{(store.name || 'S')[0]}</Text>
              </LinearGradient>
            )}
            <View style={styles.headInfo}>
              <Text style={styles.name}>{store.name}</Text>
              {store.rating > 0 ? (
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingValue}>{store.rating.toFixed(1)}</Text>
                  <Stars rating={store.rating} count={store.totalReviews} size={12} />
                </View>
              ) : null}
              <View style={styles.openRow}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>OPEN NOW</Text>
                {store.hoursDisplay ? (
                  <Text style={styles.hours}>· {store.hoursDisplay}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {store.address ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={15} color={colors.primary} />
              <Text style={styles.detailText}>{store.address}</Text>
            </View>
          ) : null}
          {store.phone ? (
            <Pressable onPress={() => open(`tel:${store.phone}`)} style={styles.detailRow}>
              <Ionicons name="call-outline" size={15} color={colors.primary} />
              <Text style={[styles.detailText, styles.link]}>{store.phone}</Text>
            </Pressable>
          ) : null}
          {store.email ? (
            <Pressable onPress={() => open(`mailto:${store.email}`)} style={styles.detailRow}>
              <Ionicons name="mail-outline" size={15} color={colors.primary} />
              <Text style={[styles.detailText, styles.link]}>{store.email}</Text>
            </Pressable>
          ) : null}

          <View style={styles.ctaRow}>
            {store.mapLink ? (
              <Button
                label="Directions"
                icon="navigate-outline"
                variant="outline"
                size="sm"
                onPress={() => open(store.mapLink)}
                style={styles.cta}
              />
            ) : null}
            {store.phone ? (
              <Button
                label="Call"
                icon="call-outline"
                size="sm"
                onPress={() => open(`tel:${store.phone}`)}
                style={styles.cta}
              />
            ) : null}
          </View>

          {store.bookingLink ? (
            <Button
              label="Book an appointment"
              variant="gold"
              icon="calendar-outline"
              onPress={() => open(store.bookingLink)}
              full
            />
          ) : null}
        </View>

        {store.description ? (
          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.aboutText}>
              {String(store.description).replace(/<[^>]+>/g, '').trim()}
            </Text>
          </View>
        ) : null}

        {store.facilities?.length ? (
          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardTitle}>Facilities</Text>
            <View style={styles.tagRow}>
              {store.facilities.map((f) => (
                <View key={f} style={styles.tag}>
                  <Text style={styles.tagText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {store.services?.length ? (
          <View style={[styles.card, shadows.xs]}>
            <Text style={styles.cardTitle}>Services</Text>
            <View style={styles.serviceGrid}>
              {store.services.map((svc, i) => (
                <View key={`${svc.title}-${i}`} style={styles.service}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.goldDark} />
                  </View>
                  <Text numberOfLines={2} style={styles.serviceText}>
                    {svc.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {products.length ? (
          <View style={styles.productBlock}>
            <SectionHeader
              eyebrow="From this boutique"
              title="Their Collection"
              actionLabel="View all"
              onAction={() =>
                navigation.navigate('Category', { name: store.name, store: store.slug })
              }
            />
            <View style={styles.grid}>
              {products.slice(0, 6).map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  width={CARD_W}
                  onPress={() =>
                    navigation.navigate('Product', { slug: p.slug || p._id, preview: p })
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  missing: { fontSize: 14, color: colors.textMuted },
  scroll: { paddingBottom: 32 },
  hero: { height: 200, justifyContent: 'flex-end', backgroundColor: colors.beige },
  heroText: { padding: 18, gap: 5 },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.4,
    color: colors.white,
  },
  heroTagline: { fontSize: 12.5, color: 'rgba(255,255,255,0.78)' },
  headCard: {
    marginHorizontal: 16,
    marginTop: -22,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 11,
  },
  headRow: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  logo: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: { fontSize: 22, fontWeight: '800', color: colors.white },
  headInfo: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  openText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: colors.successDark },
  hours: { fontSize: 10.5, color: colors.textFaint },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  detailText: { flex: 1, fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  link: { color: colors.primary, fontWeight: '600' },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cta: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 11,
  },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  aboutText: { fontSize: 13.5, color: colors.textMuted, lineHeight: 21 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  tagText: { fontSize: 11.5, color: colors.textMuted },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  service: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 9 },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: colors.text },
  productBlock: { marginTop: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: 16 },
});
