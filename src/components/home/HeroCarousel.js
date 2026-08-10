import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = Math.round(CARD_W * 0.72);
const AUTOPLAY_MS = 5000;

export default function HeroCarousel({ banners = [], onPressBanner }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const slides = banners.length ? banners : [{ _id: 'fallback' }];

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % slides.length;
        listRef.current?.scrollToOffset({ offset: next * CARD_W, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const renderItem = ({ item }) => {
    const uri = item.mobileImage || item.image;
    return (
      <Pressable
        onPress={() => onPressBanner?.(item)}
        style={[styles.slide, shadows.md]}
        disabled={!onPressBanner || !(item.ctaLink || item.link)}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={280} />
        ) : (
          <LinearGradient
            colors={gradients.heroFallback}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(52,37,35,0.55)']}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {item.title || item.subtitle ? (
          <View style={styles.caption}>
            {item.subtitle ? <Text style={styles.eyebrow}>{item.subtitle}</Text> : null}
            {item.title ? (
              <Text numberOfLines={2} style={styles.title}>
                {item.title}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item, i) => String(item._id || i)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / CARD_W))
        }
      />

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={String(s._id || i)} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16 },
  slide: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.beige,
    justifyContent: 'flex-end',
  },
  caption: { padding: 18, gap: 5 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.champagne,
  },
  title: { fontSize: 21, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary200 },
  dotActive: { width: 20, backgroundColor: colors.gold },
});
