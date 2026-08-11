import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import SectionHeader from '../components/ui/SectionHeader';
import ProductCard from '../components/product/ProductCard';
import HeroCarousel from '../components/home/HeroCarousel';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { CartButton } from '../components/ui/AppHeader';
import { blogAPI, categoryAPI, cmsAPI, productAPI } from '../services/api';
import useWishlistStore from '../store/wishlistStore';
import { colors, gradients, radius, shadows } from '../theme';
import { COMPANY } from '../config/company';

const { width: SCREEN_W } = Dimensions.get('window');
const RAIL_CARD_W = Math.round(SCREEN_W * 0.44);
const GRID_GAP = 12;
const GRID_CARD_W = (SCREEN_W - 32 - GRID_GAP) / 2;
const COLLECTION_CARD_W = Math.round(SCREEN_W * 0.42);
const COLLECTION_CARD_H = Math.round(COLLECTION_CARD_W * (4 / 3));

const FOOTER_LINKS = [
  { label: 'About Us', screen: 'StaticPage', params: { pageKey: 'about' } },
  { label: 'Contact', screen: 'StaticPage', params: { pageKey: 'contact' } },
  { label: 'FAQ', screen: 'StaticPage', params: { pageKey: 'faq' } },
  { label: 'Shipping', screen: 'StaticPage', params: { pageKey: 'shipping' } },
  { label: 'Refund', screen: 'StaticPage', params: { pageKey: 'refund' } },
  { label: 'Privacy', screen: 'StaticPage', params: { pageKey: 'privacy' } },
  { label: 'Terms', screen: 'StaticPage', params: { pageKey: 'terms' } },
  { label: 'Journal', screen: 'Blog' },
  { label: 'Boutiques', screen: 'Stores' },
  { label: 'Become a Seller', screen: 'BecomeSeller' },
];

const USPS = [
  { icon: 'shield-checkmark-outline', title: 'BIS Hallmarked', note: 'Certified purity' },
  { icon: 'swap-horizontal-outline', title: 'Lifetime Exchange', note: 'On all jewellery' },
  { icon: 'cube-outline', title: 'Free Insured Shipping', note: 'Across India' },
  { icon: 'refresh-outline', title: '15-Day Returns', note: 'No questions asked' },
];

function TopBar() {
  const navigation = useNavigation();
  const wishCount = useWishlistStore((s) => s.items.length);

  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.brand}>{COMPANY.name.toUpperCase()}</Text>
        <Text style={styles.brandSub}>Fine Jewellery</Text>
      </View>
      <View style={styles.topActions}>
        <Pressable onPress={() => navigation.navigate('Search')} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="search-outline" size={21} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'Wishlist' })}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons name="heart-outline" size={21} color={colors.primary} />
          {wishCount > 0 ? <View style={styles.dotBadge} /> : null}
        </Pressable>
        <CartButton />
      </View>
    </View>
  );
}

function SearchPill() {
  const navigation = useNavigation();
  return (
    <Pressable onPress={() => navigation.navigate('Search')} style={[styles.searchPill, shadows.xs]}>
      <Ionicons name="search" size={17} color={colors.textFaint} />
      <Text style={styles.searchText}>Search rings, necklaces, earrings…</Text>
    </Pressable>
  );
}

function CategoryCircle({ category, onPress }) {
  const uri = category.image?.url || category.image;
  return (
    <Pressable onPress={onPress} style={styles.catItem}>
      <View style={[styles.catCircle, shadows.sm]}>
        {uri ? (
          <Image source={{ uri }} style={styles.catImage} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={[colors.champagne, colors.blush]} style={styles.catImage}>
            <Ionicons name="diamond-outline" size={24} color={colors.goldDark} />
          </LinearGradient>
        )}
      </View>
      <Text numberOfLines={1} style={styles.catLabel}>
        {category.name}
      </Text>
    </Pressable>
  );
}

function ProductRail({ products, loading, onPressProduct }) {
  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {[0, 1, 2].map((i) => (
          <ProductCardSkeleton key={i} width={RAIL_CARD_W} />
        ))}
      </ScrollView>
    );
  }

  if (!products.length) return null;

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      renderItem={({ item, index }) => (
        <ProductCard
          product={item}
          index={index}
          width={RAIL_CARD_W}
          onPress={() => onPressProduct(item)}
        />
      )}
    />
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [collectionSlides, setCollectionSlides] = useState([]);
  const [collectionMeta, setCollectionMeta] = useState({
    title: 'Our Collections',
    subtitle: 'Styled for every moment',
  });

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      cmsAPI.getBanners('hero'),
      categoryAPI.getAll({ parent: 'null' }),
      productAPI.getAll({ limit: 12, isFeatured: true, sort: 'rating' }),
      productAPI.getAll({ limit: 8, segments: 'Deal of Week', sort: 'newest' }),
      productAPI.getAll({ limit: 8, isNewArrival: true, sort: 'newest' }),
      blogAPI.getAll({ limit: 4 }),
      cmsAPI.getPageSections('home'),
    ]);

    const pick = (r) => (r.status === 'fulfilled' ? r.value.data.data || [] : []);
    const [bannerRes, catRes, featRes, dealRes, newRes, blogRes, sectionsRes] = results;

    const featuredList = pick(featRes);
    const dealList = pick(dealRes);
    const arrivalList = pick(newRes);

    setBanners(pick(bannerRes));
    setCategories(pick(catRes));
    setFeatured(featuredList);
    const dealsFinal = dealList.length ? dealList.slice(0, 8) : featuredList.slice(0, 8);
    const dealIds = new Set(dealsFinal.map((p) => p._id));
    const arrivalsFinal = (arrivalList.length ? arrivalList : featuredList)
      .filter((p) => !dealIds.has(p._id))
      .slice(0, 8);
    setDeals(dealsFinal);
    setArrivals(arrivalsFinal);
    setBlogs(pick(blogRes));

    const sections = pick(sectionsRes);
    const visit = sections.find((s) => s.sectionType === 'visit_stores');
    const content = visit?.content || {};
    const legacy = /store/i.test(content.title || '');
    const slides = legacy
      ? []
      : (content.stores || content.slides || [])
          .filter((s) => s?.image)
          .map((s) => ({
            name: s.name || 'Collection',
            image: s.image,
            link: s.link || s.href || '',
            slug: (s.link || '').replace(/^\/collections\//, '') || undefined,
          }));
    setCollectionSlides(slides);
    setCollectionMeta({
      title: legacy ? 'Our Collections' : content.title || 'Our Collections',
      subtitle: legacy ? 'Styled for every moment' : content.subtitle || 'Styled for every moment',
    });
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openProduct = (product) =>
    navigation.navigate('Product', { slug: product.slug || product._id, preview: product });

  const openCategory = (category) =>
    navigation.navigate('Category', { slug: category.slug, name: category.name });

  return (
    <Screen edges={['top']}>
      <TopBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <SearchPill />

        <HeroCarousel banners={banners} />

        {categories.length ? (
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Curated"
              title="Shop by Category"
              actionLabel="All"
              onAction={() => navigation.navigate('Tabs', { screen: 'Shop' })}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRail}
            >
              {categories.map((c) => (
                <CategoryCircle key={c._id} category={c} onPress={() => openCategory(c)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.uspStrip}>
          {USPS.map((u) => (
            <View key={u.title} style={styles.uspItem}>
              <View style={styles.uspIcon}>
                <Ionicons name={u.icon} size={17} color={colors.goldDark} />
              </View>
              <Text numberOfLines={2} style={styles.uspTitle}>
                {u.title}
              </Text>
              <Text numberOfLines={1} style={styles.uspNote}>
                {u.note}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <SectionHeader
            eyebrow="Handpicked"
            title="Featured Pieces"
            subtitle="Our most loved designs this season"
          />
          <ProductRail products={featured} loading={loading} onPressProduct={openProduct} />
        </View>

        {deals.length ? (
          <View style={styles.block}>
            <LinearGradient
              colors={[colors.champagne, colors.blush]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dealBanner}
            >
              <View style={styles.dealTextCol}>
                <Text style={styles.dealEyebrow}>Limited Time</Text>
                <Text style={styles.dealTitle}>Deal of the Week</Text>
                <Text style={styles.dealNote}>Up to 25% off on making charges</Text>
              </View>
              <Ionicons name="pricetag" size={34} color="rgba(156,126,42,0.35)" />
            </LinearGradient>
            <ProductRail products={deals} loading={loading} onPressProduct={openProduct} />
          </View>
        ) : null}

        {arrivals.length ? (
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Just In"
              title="New Arrivals"
              actionLabel="View all"
              onAction={() => navigation.navigate('Category', { name: 'New Arrivals', isNewArrival: true })}
            />
            <View style={styles.grid}>
              {arrivals.slice(0, 6).map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  width={GRID_CARD_W}
                  onPress={() => openProduct(p)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {collectionSlides.length ? (
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Collections"
              title={collectionMeta.title}
              subtitle={collectionMeta.subtitle}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {collectionSlides.map((item) => (
                <Pressable
                  key={item.image}
                  onPress={() => {
                    if (item.slug) {
                      navigation.navigate('Category', { slug: item.slug, name: item.name });
                    } else {
                      navigation.navigate('Tabs', { screen: 'Shop' });
                    }
                  }}
                  style={[styles.collectionCard, shadows.sm]}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.collectionCardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(20,12,8,0.75)']}
                    style={styles.collectionCardFade}
                  />
                  <View style={styles.collectionCardMeta}>
                    <Text numberOfLines={1} style={styles.collectionCardName}>
                      {item.name}
                    </Text>
                    <Text style={styles.collectionCardCta}>Explore ›</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {blogs.length ? (
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Journal"
              title="Style Notes"
              actionLabel="Read all"
              onAction={() => navigation.navigate('Blog')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {blogs.map((b) => (
                <Pressable
                  key={b._id}
                  onPress={() => navigation.navigate('BlogDetail', { slug: b.slug, preview: b })}
                  style={[styles.blogCard, shadows.sm]}
                >
                  {b.image ? (
                    <Image source={{ uri: b.image }} style={styles.blogImage} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={[colors.blush, colors.beige]} style={styles.blogImage} />
                  )}
                  <View style={styles.blogBody}>
                    <Text numberOfLines={2} style={styles.blogTitle}>
                      {b.title}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <LinearGradient colors={gradients.primary} style={styles.footer}>
          <Text style={styles.footerBrand}>{COMPANY.name.toUpperCase()}</Text>
          <Text style={styles.footerNote}>
            Crafted with certified gold and ethically sourced diamonds.
          </Text>
          <View style={styles.footerRow}>
            {['BIS Hallmark', 'IGI Certified', 'Secure Payments'].map((t) => (
              <View key={t} style={styles.footerChip}>
                <Ionicons name="checkmark-circle" size={12} color={colors.goldLight} />
                <Text style={styles.footerChipText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footerLinks}>
            {FOOTER_LINKS.map((link) => (
              <Pressable
                key={link.label}
                onPress={() => navigation.navigate(link.screen, link.params)}
                hitSlop={6}
              >
                <Text style={styles.footerLink}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  brand: { fontSize: 19, fontWeight: '800', letterSpacing: 3.5, color: colors.primary },
  brandSub: {
    fontSize: 8.5,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.goldDark,
    marginTop: 1,
  },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  dotBadge: {
    position: 'absolute',
    top: 8,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  scroll: { paddingBottom: 28 },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: { fontSize: 13.5, color: colors.textFaint },
  block: { marginTop: 30 },
  catRail: { paddingHorizontal: 16, gap: 16 },
  catItem: { alignItems: 'center', width: 72, gap: 7 },
  catCircle: {
    width: 66,
    height: 66,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.white,
  },
  catImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  uspStrip: {
    flexDirection: 'row',
    marginTop: 26,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  uspItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4, gap: 4 },
  uspIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uspTitle: { fontSize: 9.5, fontWeight: '700', color: colors.text, textAlign: 'center' },
  uspNote: { fontSize: 8.5, color: colors.textFaint, textAlign: 'center' },
  rail: { paddingHorizontal: 16, gap: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: 16,
  },
  dealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: radius.xl,
  },
  dealTextCol: { gap: 3 },
  dealEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  dealTitle: { fontSize: 19, fontWeight: '700', color: colors.primary },
  dealNote: { fontSize: 12, color: colors.primary700 },
  collectionCard: {
    width: COLLECTION_CARD_W,
    height: COLLECTION_CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#efe8df',
    borderWidth: 1,
    borderColor: colors.border,
  },
  collectionCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  collectionCardFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  collectionCardMeta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  collectionCardName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  collectionCardCta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  blogCard: {
    width: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blogImage: { width: '100%', height: 110 },
  blogBody: { padding: 12 },
  blogTitle: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 },
  footer: {
    marginTop: 36,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: radius.card,
    alignItems: 'center',
    gap: 9,
  },
  footerBrand: { fontSize: 15, fontWeight: '800', letterSpacing: 3, color: colors.white },
  footerNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  footerChipText: { fontSize: 10, fontWeight: '600', color: colors.champagne },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 18,
    rowGap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  footerLink: { fontSize: 11.5, color: 'rgba(255,255,255,0.72)' },
});
