import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import { blogAPI } from '../services/api';
import { colors, radius, shadows } from '../theme';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

export default function BlogScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    blogAPI
      .getAll({ limit: 50 })
      .then(({ data }) => setPosts(data.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category).filter(Boolean));
    return ['ALL', ...set];
  }, [posts]);

  const visible = category === 'ALL' ? posts : posts.filter((p) => p.category === category);
  const [featured, ...rest] = visible;

  const openPost = (post) => navigation.navigate('BlogDetail', { slug: post.slug, preview: post });

  return (
    <Screen>
      <AppHeader title="Journal" subtitle="Stories, care guides & style notes" />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              {categories.length > 2 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabRow}
                >
                  {categories.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[styles.tab, category === c && styles.tabActive]}
                    >
                      <Text style={[styles.tabText, category === c && styles.tabTextActive]}>
                        {c === 'ALL' ? 'All' : c}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              {featured ? (
                <Pressable onPress={() => openPost(featured)} style={[styles.hero, shadows.md]}>
                  {featured.image ? (
                    <Image
                      source={{ uri: featured.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={250}
                    />
                  ) : (
                    <LinearGradient
                      colors={[colors.blush, colors.beige]}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(52,37,35,0.78)']}
                    locations={[0.35, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.heroText}>
                    <Text style={styles.heroCategory}>{featured.category || 'JOURNAL'}</Text>
                    <Text numberOfLines={3} style={styles.heroTitle}>
                      {featured.imageTitle || featured.title}
                    </Text>
                    <Text style={styles.heroMeta}>
                      {featured.author || 'Admin'} · {formatDate(featured.publishedAt || featured.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => openPost(item)} style={[styles.card, shadows.xs]}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />
              ) : (
                <LinearGradient colors={[colors.champagne, colors.blush]} style={styles.cardImage} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardCategory}>{item.category || 'JOURNAL'}</Text>
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {item.title}
                </Text>
                {item.excerpt ? (
                  <Text numberOfLines={2} style={styles.cardExcerpt}>
                    {item.excerpt}
                  </Text>
                ) : null}
                <View style={styles.cardFoot}>
                  <Text style={styles.cardDate}>
                    {formatDate(item.publishedAt || item.createdAt)}
                  </Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            featured ? null : (
              <EmptyState
                icon="book-outline"
                title="No articles yet"
                message="Our editors are working on new stories. Check back soon."
              />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 12 },
  header: { gap: 16, marginBottom: 4 },
  tabRow: { gap: 8, paddingVertical: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  hero: {
    height: 240,
    borderRadius: radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.beige,
  },
  heroText: { padding: 18, gap: 6 },
  heroCategory: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: colors.champagne,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.white, lineHeight: 27 },
  heroMeta: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 11,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.primary50 },
  cardBody: { flex: 1, gap: 4 },
  cardCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.goldDark,
  },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text, lineHeight: 18 },
  cardExcerpt: { fontSize: 11.5, color: colors.textMuted, lineHeight: 16 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  cardDate: { fontSize: 10.5, color: colors.textFaint },
});
