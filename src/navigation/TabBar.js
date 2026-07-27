import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import { colors, radius, shadows } from '../theme';

const ICONS = {
  Home: ['home', 'home-outline'],
  Shop: ['grid', 'grid-outline'],
  Wishlist: ['heart', 'heart-outline'],
  Cart: ['bag-handle', 'bag-handle-outline'],
  Account: ['person', 'person-outline'],
};

export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.items.reduce((t, i) => t + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.items.length);

  return (
    <View style={[styles.wrap, shadows.lg, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const [active, inactive] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
        const count = route.name === 'Cart' ? cartCount : route.name === 'Wishlist' ? wishCount : 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <View style={styles.iconWrap}>
              {focused ? (
                <LinearGradient
                  colors={[colors.primary100, 'rgba(240,232,231,0)']}
                  style={styles.activeGlow}
                />
              ) : null}
              <Ionicons
                name={focused ? active : inactive}
                size={22}
                color={focused ? colors.primary : colors.textFaint}
              />
              {count > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            {focused ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 9,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 44, height: 26, alignItems: 'center', justifyContent: 'center' },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 26,
    borderRadius: radius.pill,
  },
  label: { fontSize: 10, fontWeight: '600', color: colors.textFaint, letterSpacing: 0.2 },
  labelActive: { color: colors.primary, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginTop: 1 },
  dotPlaceholder: { height: 5 },
  badge: {
    position: 'absolute',
    top: -3,
    right: 4,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3.5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
});
