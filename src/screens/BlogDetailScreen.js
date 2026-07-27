import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import { blogAPI } from '../services/api';
import { colors, radius, shadows } from '../theme';

/** Blog bodies are stored as HTML, so we flatten them into readable paragraphs. */
function toParagraphs(html) {
  if (!html) return [];
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function BlogDetailScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const [post, setPost] = useState(params.preview || null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    blogAPI
      .getBySlug(params.slug)
      .then(async ({ data }) => {
        if (cancelled) return;
        setPost(data.data);
        try {
          const res = await blogAPI.getAll({ limit: 5 });
          if (!cancelled) {
            setRelated((res.data.data || []).filter((p) => p.slug !== params.slug).slice(0, 4));
          }
        } catch {
          // Related posts are optional.
        }
      })
      .catch(() => {
        if (!cancelled && !params.preview) setPost(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug, params.preview]);

  if (loading && !post) {
    return (
      <Screen>
        <AppHeader title="Journal" />
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen>
        <AppHeader title="Journal" />
        <View style={styles.center}>
          <Text style={styles.missing}>This article is no longer available.</Text>
          <Button label="Back to journal" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const paragraphs = toParagraphs(post.content);
  const published = post.publishedAt || post.createdAt;

  return (
    <Screen>
      <AppHeader
        title={post.category || 'Journal'}
        right={
          <Pressable
            onPress={() => Share.share({ message: post.title }).catch(() => {})}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.cover, shadows.sm]}>
          {post.image ? (
            <Image
              source={{ uri: post.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <LinearGradient colors={[colors.blush, colors.beige]} style={StyleSheet.absoluteFill} />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{post.category || 'JOURNAL'}</Text>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.meta}>
            {post.author || 'Admin'}
            {published
              ? ` · ${new Date(published).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              : ''}
          </Text>

          {post.excerpt ? <Text style={styles.excerpt}>{post.excerpt}</Text> : null}

          <View style={styles.rule} />

          {paragraphs.length ? (
            paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))
          ) : (
            <Text style={styles.paragraph}>Full article coming soon.</Text>
          )}
        </View>

        {related.length ? (
          <View style={styles.relatedBlock}>
            <Text style={styles.relatedHead}>More from the journal</Text>
            {related.map((r) => (
              <Pressable
                key={r._id}
                onPress={() => navigation.push('BlogDetail', { slug: r.slug, preview: r })}
                style={[styles.relatedCard, shadows.xs]}
              >
                {r.image ? (
                  <Image source={{ uri: r.image }} style={styles.relatedImage} contentFit="cover" />
                ) : (
                  <LinearGradient
                    colors={[colors.champagne, colors.blush]}
                    style={styles.relatedImage}
                  />
                )}
                <Text numberOfLines={2} style={styles.relatedTitle}>
                  {r.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </Pressable>
            ))}
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
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 34 },
  cover: {
    height: 230,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.beige,
  },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  category: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: colors.goldDark,
  },
  title: { fontSize: 23, fontWeight: '800', color: colors.text, lineHeight: 31, letterSpacing: -0.4 },
  meta: { fontSize: 12, color: colors.textFaint },
  excerpt: {
    fontSize: 14.5,
    color: colors.primary700,
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 6,
  },
  rule: { width: 46, height: 2, borderRadius: 2, backgroundColor: colors.gold, marginVertical: 12 },
  paragraph: { fontSize: 14.5, color: colors.textMuted, lineHeight: 24, marginBottom: 12 },
  relatedBlock: { marginTop: 20, paddingHorizontal: 16, gap: 10 },
  relatedHead: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 2,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relatedImage: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.primary50 },
  relatedTitle: { flex: 1, fontSize: 12.5, fontWeight: '600', color: colors.text, lineHeight: 17 },
});
