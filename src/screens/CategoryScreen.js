import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import FilterSheet, { SORTS, countActiveFilters } from '../components/product/FilterSheet';
import { attributeAPI, productAPI, storeAPI } from '../services/api';
import { colors, radius, shadows } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 12;
const CARD_W = (SCREEN_W - 32 - GAP) / 2;
const PAGE_SIZE = 20;

export default function CategoryScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { slug, name, isNewArrival, isBestSeller, store: initialStore } = params;

  const [filters, setFilters] = useState(() => ({
    sort: SORTS.some((s) => s.key === params.sort) ? params.sort : 'newest',
    maxPrice: params.maxPrice,
    store: initialStore,
  }));
  const [attributes, setAttributes] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    attributeAPI
      .getAll({ filterable: true })
      .then(({ data }) => setAttributes(data.data || []))
      .catch(() => setAttributes([]));
    storeAPI
      .getStores()
      .then(({ data }) => setStores(data.data || []))
      .catch(() => setStores([]));
  }, []);

  const queryKey = JSON.stringify(filters);

  const fetchPage = useCallback(
    async (targetPage) => {
      const query = { page: targetPage, limit: PAGE_SIZE };
      if (slug) query.category = slug;
      if (isNewArrival) query.isNewArrival = 'true';
      if (isBestSeller) query.isBestSeller = 'true';

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query[key] = Array.isArray(value) ? value.join(',') : value;
      });

      const { data } = await productAPI.getAll(query);
      return { items: data.data || [], meta: data.meta || {} };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, isNewArrival, isBestSeller, queryKey]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(1)
      .then(({ items, meta }) => {
        if (cancelled) return;
        setProducts(items);
        setPage(1);
        setTotal(meta.total ?? items.length);
        setHasNext(!!meta.hasNextPage);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = async () => {
    if (loadingMore || !hasNext || loading) return;
    setLoadingMore(true);
    try {
      const { items, meta } = await fetchPage(page + 1);
      setProducts((prev) => [...prev, ...items]);
      setPage((p) => p + 1);
      setHasNext(!!meta.hasNextPage);
    } catch {
      setHasNext(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const activeCount = countActiveFilters(filters);
  const activeSort = SORTS.find((s) => s.key === filters.sort);

  const chips = useMemo(() => {
    const out = [];
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      out.push({
        key: 'price',
        label: `₹${filters.minPrice ?? 0}${filters.maxPrice ? ` – ₹${filters.maxPrice}` : '+'}`,
        clear: () => setFilters((f) => ({ ...f, minPrice: undefined, maxPrice: undefined })),
      });
    }
    if (filters.store) {
      const s = stores.find((st) => st.slug === filters.store);
      out.push({
        key: 'store',
        label: s?.name || 'Boutique',
        clear: () => setFilters((f) => ({ ...f, store: undefined })),
      });
    }
    Object.keys(filters)
      .filter((k) => k.startsWith('attr_') && filters[k]?.length)
      .forEach((k) => {
        const attr = attributes.find((a) => `attr_${a.slug}` === k);
        out.push({
          key: k,
          label: `${attr?.name || 'Filter'}: ${filters[k].length}`,
          clear: () => setFilters((f) => ({ ...f, [k]: undefined })),
        });
      });
    return out;
  }, [filters, stores, attributes]);

  return (
    <Screen>
      <AppHeader title={name || 'Collection'} subtitle={total ? `${total} pieces` : undefined} />

      <View style={styles.toolbar}>
        <Pressable onPress={() => setFilterOpen(true)} style={[styles.toolBtn, shadows.xs]}>
          <Ionicons name="options-outline" size={15} color={colors.primary} />
          <Text style={styles.toolText}>Filters</Text>
          {activeCount ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable onPress={() => setFilterOpen(true)} style={[styles.toolBtn, shadows.xs]}>
          <Ionicons name="swap-vertical-outline" size={15} color={colors.primary} />
          <Text style={styles.toolText}>{activeSort?.label}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Search')} style={[styles.toolBtn, shadows.xs]}>
          <Ionicons name="search-outline" size={15} color={colors.primary} />
        </Pressable>
      </View>

      {chips.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {chips.map((c) => (
            <Pressable key={c.key} onPress={c.clear} style={styles.chip}>
              <Text style={styles.chipText}>{c.label}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} width={CARD_W} />
          ))}
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <ProductCard
              product={item}
              index={index}
              width={CARD_W}
              onPress={() =>
                navigation.navigate('Product', { slug: item.slug || item._id, preview: item })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="diamond-outline"
              title="No products found"
              message="Try adjusting your filters to discover more beautiful pieces."
              actionLabel="Clear all filters"
              onAction={() => setFilters({ sort: 'newest' })}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        attributes={attributes}
        stores={stores}
        onApply={setFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 9, paddingHorizontal: 16, paddingVertical: 12 },
  toolBtn: {
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
  toolText: { fontSize: 12.5, fontWeight: '600', color: colors.text },
  countBadge: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 9.5, fontWeight: '800', color: colors.white },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    borderWidth: 1,
    borderColor: colors.primary200,
  },
  chipText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  row: { gap: GAP, marginBottom: GAP },
  footerLoader: { marginVertical: 18 },
});
