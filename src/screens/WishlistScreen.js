import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import { CartButton } from '../components/ui/AppHeader';
import useWishlistStore from '../store/wishlistStore';
import useCartStore from '../store/cartStore';
import { colors } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 12;
const CARD_W = (SCREEN_W - 32 - GAP) / 2;

export default function WishlistScreen() {
  const navigation = useNavigation();
  const items = useWishlistStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  const moveAllToCart = () => {
    items.forEach((p) => {
      if ((Number(p.stock) || 0) > 0) addItem(p, 1);
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Wishlist</Text>
          {items.length ? (
            <Text style={styles.headerCount}>
              {items.length} saved piece{items.length === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          {items.length ? (
            <Pressable onPress={moveAllToCart} hitSlop={8} style={styles.moveBtn}>
              <Text style={styles.moveText}>Add all to cart</Text>
            </Pressable>
          ) : null}
          <CartButton />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item?._id || i)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
            icon="heart-outline"
            title="No favourites yet"
            message="Tap the heart on any piece to save it for later."
            actionLabel="Explore collections"
            onAction={() => navigation.navigate('Tabs', { screen: 'Shop' })}
          />
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
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  headerCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moveBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  moveText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  list: { paddingHorizontal: 16, paddingBottom: 28 },
  row: { gap: GAP, marginBottom: GAP },
});
