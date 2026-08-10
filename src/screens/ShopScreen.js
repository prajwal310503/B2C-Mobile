import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import SectionHeader from '../components/ui/SectionHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { CartButton } from '../components/ui/AppHeader';
import { categoryAPI } from '../services/api';
import { colors, gradients, radius, shadows } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 12;
const TILE_W = (SCREEN_W - 32 - GAP) / 2;

const QUICK_LINKS = [
  { label: 'New Arrivals', icon: 'sparkles-outline', params: { isNewArrival: true } },
  { label: 'Bestsellers', icon: 'flame-outline', params: { isBestSeller: true } },
  { label: 'Under ₹25,000', icon: 'pricetag-outline', params: { maxPrice: 25000 } },
  { label: 'On Sale', icon: 'cut-outline', params: { sort: 'discount' } },
  { label: 'Boutiques', icon: 'storefront-outline', screen: 'Stores' },
  { label: 'Journal', icon: 'book-outline', screen: 'Blog' },
];

export default function ShopScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryAPI
      .getAll({})
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const renderTile = ({ item, index }) => {
    const uri = item.image?.url || item.image;
    const palette = gradients.card[index % gradients.card.length];
    return (
      <Pressable
        onPress={() => navigation.navigate('Category', { slug: item.slug, name: item.name })}
        style={({ pressed }) => [
          styles.tile,
          shadows.sm,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.tileImageWrap}>
          {uri ? (
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <LinearGradient colors={palette} style={[StyleSheet.absoluteFill, styles.tileFallback]}>
              <Ionicons name="diamond-outline" size={30} color="rgba(201,168,76,0.7)" />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(52,37,35,0.6)']}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tileCaption}>
            <Text numberOfLines={1} style={styles.tileTitle}>
              {item.name}
            </Text>
            {item.productCount != null ? (
              <Text style={styles.tileCount}>{item.productCount} pieces</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('Search')} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="search-outline" size={21} color={colors.primary} />
          </Pressable>
          <CartButton />
        </View>
      </View>

      <FlatList
        data={loading ? [] : categories}
        keyExtractor={(item) => item._id}
        renderItem={renderTile}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.quickRow}>
              {QUICK_LINKS.map((q) => (
                <Pressable
                  key={q.label}
                  onPress={() =>
                    q.screen
                      ? navigation.navigate(q.screen)
                      : navigation.navigate('Category', { name: q.label, ...q.params })
                  }
                  style={[styles.quickChip, shadows.xs]}
                >
                  <Ionicons name={q.icon} size={15} color={colors.goldDark} />
                  <Text style={styles.quickText}>{q.label}</Text>
                </Pressable>
              ))}
            </View>
            <SectionHeader eyebrow="Collections" title="Browse Categories" />
            {loading ? (
              <View style={styles.skeletonGrid}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} width={TILE_W} height={TILE_W * 1.05} round={radius.xl} />
                ))}
              </View>
            ) : null}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  row: { gap: GAP, marginBottom: GAP },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    width: TILE_W,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  tileImageWrap: { width: '100%', height: TILE_W * 1.05, justifyContent: 'flex-end' },
  tileFallback: { alignItems: 'center', justifyContent: 'center' },
  tileCaption: { padding: 12, gap: 2 },
  tileTitle: { fontSize: 14, fontWeight: '700', color: colors.white },
  tileCount: { fontSize: 10.5, color: 'rgba(255,255,255,0.75)' },
});
