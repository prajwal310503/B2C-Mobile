import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Stars from '../components/ui/Stars';
import EmptyState from '../components/ui/EmptyState';
import { storeAPI } from '../services/api';
import { colors, gradients, radius, shadows } from '../theme';

export default function StoresScreen() {
  const navigation = useNavigation();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('ALL');

  useEffect(() => {
    storeAPI
      .getStores({})
      .then(({ data }) => setStores(data.data || []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => {
    const set = new Set(stores.map((s) => s.city).filter(Boolean));
    return ['ALL', ...set];
  }, [stores]);

  const visible = stores.filter((s) => {
    const matchesCity = city === 'ALL' || s.city === city;
    const term = query.trim().toLowerCase();
    const matchesQuery =
      !term ||
      s.name?.toLowerCase().includes(term) ||
      s.city?.toLowerCase().includes(term) ||
      s.tagline?.toLowerCase().includes(term);
    return matchesCity && matchesQuery;
  });

  return (
    <Screen>
      <AppHeader title="Boutiques" subtitle={`${stores.length} partner shops`} />

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, shadows.xs]}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search boutiques or cities"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {cities.length > 2 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityRow}
        >
          {cities.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCity(c)}
              style={[styles.cityChip, city === c && styles.cityChipActive]}
            >
              <Text style={[styles.cityText, city === c && styles.cityTextActive]}>
                {c === 'ALL' ? 'All cities' : c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('StoreDetail', { slug: item.slug, preview: item })}
              style={({ pressed }) => [styles.card, shadows.sm, pressed && styles.cardPressed]}
            >
              <View style={styles.banner}>
                {item.banner || item.image ? (
                  <Image
                    source={{ uri: item.banner || item.image }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={220}
                  />
                ) : (
                  <LinearGradient colors={gradients.heroFallback} style={StyleSheet.absoluteFill} />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(52,37,35,0.6)']}
                  locations={[0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                {item.isFeatured ? (
                  <View style={styles.featuredTag}>
                    <Ionicons name="star" size={9} color={colors.primary900} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.logoWrap}>
                  {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.logo} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={gradients.gold} style={styles.logo}>
                      <Text style={styles.logoInitial}>{(item.name || 'S')[0]}</Text>
                    </LinearGradient>
                  )}
                </View>

                <View style={styles.info}>
                  <Text numberOfLines={1} style={styles.name}>
                    {item.name}
                  </Text>
                  {item.tagline ? (
                    <Text numberOfLines={1} style={styles.tagline}>
                      {item.tagline}
                    </Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    {item.city ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color={colors.textFaint} />
                        <Text style={styles.metaText}>{item.city}</Text>
                      </View>
                    ) : null}
                    {item.rating > 0 ? <Stars rating={item.rating} size={11} showCount={false} /> : null}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={17} color={colors.textFaint} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title="No boutiques found"
              message="Try a different city or search term."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 },
  cityRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  cityChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  cityTextActive: { color: colors.white },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 14 },
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { transform: [{ scale: 0.99 }] },
  banner: { height: 116, backgroundColor: colors.beige },
  featuredTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
  },
  featuredText: { fontSize: 9.5, fontWeight: '800', color: colors.primary900 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  logoWrap: { marginTop: -30 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: { fontSize: 20, fontWeight: '800', color: colors.white },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  tagline: { fontSize: 11.5, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: colors.textFaint },
});
