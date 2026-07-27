import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useCartStore from '../../store/cartStore';
import { colors, radius } from '../../theme';

export function CartButton({ tint = colors.primary }) {
  const navigation = useNavigation();
  const count = useCartStore((s) => s.items.reduce((t, i) => t + i.quantity, 0));

  return (
    <Pressable
      onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
      hitSlop={8}
      style={styles.iconBtn}
    >
      <Ionicons name="bag-handle-outline" size={21} color={tint} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function AppHeader({ title, subtitle, showBack = true, right, transparent = false }) {
  const navigation = useNavigation();

  return (
    <View style={[styles.header, transparent && styles.transparent]}>
      {showBack ? (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={23} color={colors.primary} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.titleCol}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightCol}>{right ?? <CartButton />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  transparent: { backgroundColor: 'transparent', borderBottomWidth: 0 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 38 },
  titleCol: { flex: 1, alignItems: 'center' },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  rightCol: { minWidth: 38, alignItems: 'flex-end' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9.5, fontWeight: '800' },
});
