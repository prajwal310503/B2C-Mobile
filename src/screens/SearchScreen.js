import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import { productAPI } from '../services/api';
import { colors, radius, shadows } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 12;
const CARD_W = (SCREEN_W - 32 - GAP) / 2;
const RECENT_KEY = 'luxury-recent-searches';
const SUGGESTIONS = ['Diamond ring', 'Gold chain', 'Bridal set', 'Earrings', 'Bracelet', 'Mangalsutra'];

export default function SearchScreen() {
  const navigation = useNavigation();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => setRecent(raw ? JSON.parse(raw) : []))
      .catch(() => setRecent([]));
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return undefined;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await productAPI.getAll({ search: term, limit: 24 });
        setResults(data.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [query]);

  const persistRecent = async (term) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 8);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
  };

  const openProduct = (product) => {
    persistRecent(query.trim());
    navigation.navigate('Product', { slug: product.slug || product._id, preview: product });
  };

  const clearRecent = async () => {
    setRecent([]);
    await AsyncStorage.removeItem(RECENT_KEY).catch(() => {});
  };

  const showIdle = query.trim().length < 2;

  return (
    <Screen>
      <View style={styles.bar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={23} color={colors.primary} />
        </Pressable>
        <View style={[styles.inputWrap, shadows.xs]}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for jewellery…"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showIdle ? (
        <View style={styles.idle}>
          {recent.length ? (
            <View style={styles.idleBlock}>
              <View style={styles.idleHead}>
                <Text style={styles.idleTitle}>Recent</Text>
                <Pressable onPress={clearRecent} hitSlop={8}>
                  <Text style={styles.clear}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.chipRow}>
                {recent.map((r) => (
                  <Pressable key={r} onPress={() => setQuery(r)} style={styles.chip}>
                    <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.chipText}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.idleBlock}>
            <Text style={styles.idleTitle}>Popular searches</Text>
            <View style={styles.chipRow}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} onPress={() => setQuery(s)} style={styles.chip}>
                  <Ionicons name="trending-up-outline" size={13} color={colors.goldDark} />
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            results.length ? (
              <Text style={styles.resultCount}>
                {results.length} result{results.length === 1 ? '' : 's'} for “{query.trim()}”
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <ProductCard
              product={item}
              index={index}
              width={CARD_W}
              onPress={() => openProduct(item)}
            />
          )}
          ListEmptyComponent={
            searched ? (
              <EmptyState
                icon="search-outline"
                title="No matches found"
                message={`We couldn't find anything for “${query.trim()}”. Try a different keyword.`}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 15,
    marginRight: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 14.5, color: colors.text, paddingVertical: 0 },
  idle: { paddingHorizontal: 16, paddingTop: 10, gap: 26 },
  idleBlock: { gap: 12 },
  idleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  idleTitle: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  clear: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
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
  chipText: { fontSize: 12.5, color: colors.text, fontWeight: '500' },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  row: { gap: GAP, marginBottom: GAP },
  resultCount: { fontSize: 12.5, color: colors.textMuted, marginBottom: 14 },
});
