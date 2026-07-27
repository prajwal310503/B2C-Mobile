import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useWishlistStore from '../store/wishlistStore';
import useCartStore from '../store/cartStore';
import { colors, gradients, radius, shadows } from '../theme';

const SECTIONS = [
  {
    title: 'My account',
    items: [
      { key: 'Profile', icon: 'person-outline', label: 'My Profile', note: 'Name, phone and password', auth: true },
      { key: 'Orders', icon: 'receipt-outline', label: 'My Orders', note: 'Track and manage purchases', auth: true },
      { key: 'Addresses', icon: 'location-outline', label: 'Saved Addresses', note: 'Manage delivery details', auth: true },
      { key: 'Wishlist', icon: 'heart-outline', label: 'Wishlist', note: 'Pieces you saved', tab: true },
      { key: 'Refer', icon: 'gift-outline', label: 'Refer & Earn', note: 'Invite friends, earn rewards', auth: true },
      { key: 'Support', icon: 'chatbubbles-outline', label: 'Help & Support', note: 'Raise a ticket with us', auth: true },
    ],
  },
  {
    title: 'Explore',
    items: [
      { key: 'Stores', icon: 'storefront-outline', label: 'Boutiques', note: 'Browse our partner shops' },
      { key: 'Blog', icon: 'book-outline', label: 'Journal', note: 'Style notes and care guides' },
      { key: 'BecomeSeller', icon: 'briefcase-outline', label: 'Become a Seller', note: 'List your jewellery shop' },
    ],
  },
  {
    title: 'Information',
    items: [
      { key: 'StaticPage', params: { pageKey: 'about' }, icon: 'information-circle-outline', label: 'About Us' },
      { key: 'StaticPage', params: { pageKey: 'contact' }, icon: 'mail-outline', label: 'Contact Us' },
      { key: 'StaticPage', params: { pageKey: 'faq' }, icon: 'help-circle-outline', label: 'FAQ' },
      { key: 'StaticPage', params: { pageKey: 'shipping' }, icon: 'cube-outline', label: 'Shipping Policy' },
      { key: 'StaticPage', params: { pageKey: 'privacy' }, icon: 'lock-closed-outline', label: 'Privacy Policy' },
      { key: 'StaticPage', params: { pageKey: 'terms' }, icon: 'document-text-outline', label: 'Terms & Conditions' },
    ],
  },
];

export default function AccountScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const wishCount = useWishlistStore((s) => s.items.length);
  const cartCount = useCartStore((s) => s.items.length);

  const go = (item) => {
    if (item.tab) {
      navigation.navigate('Tabs', { screen: item.key });
      return;
    }
    if (item.auth && !token) {
      navigation.navigate('Login', { redirect: item.key });
      return;
    }
    navigation.navigate(item.key, item.params);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, shadows.md]}
        >
          <View style={styles.heroRow}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name || 'G')[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.heroText}>
              <Text style={styles.heroName}>{user?.name || 'Guest'}</Text>
              <Text style={styles.heroMeta}>
                {user?.email || 'Sign in to sync your orders and wishlist'}
              </Text>
            </View>
          </View>

          {token ? (
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{wishCount}</Text>
                <Text style={styles.statLabel}>Wishlist</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{cartCount}</Text>
                <Text style={styles.statLabel}>In cart</Text>
              </View>
              <View style={styles.statDivider} />
              <Pressable style={styles.stat} onPress={() => navigation.navigate('Orders')}>
                <Ionicons name="arrow-forward-circle" size={19} color={colors.goldLight} />
                <Text style={styles.statLabel}>Orders</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.authRow}>
              <Button
                label="Sign In"
                variant="gold"
                size="sm"
                onPress={() => navigation.navigate('Login')}
                style={styles.authBtn}
              />
              <Button
                label="Register"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate('Register')}
                style={styles.authBtn}
              />
            </View>
          )}
        </LinearGradient>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menu}>
              {section.items.map((item) => (
                <Pressable
                  key={`${item.key}-${item.params?.pageKey || item.label}`}
                  onPress={() => go(item)}
                  style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={19} color={colors.primary} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.note ? <Text style={styles.menuNote}>{item.note}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={colors.textFaint} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={19} color={colors.goldDark} />
          <Text style={styles.infoText}>
            Every piece is BIS hallmarked and comes with a lifetime exchange guarantee.
          </Text>
        </View>

        {token ? (
          <Button
            label="Log out"
            variant="outline"
            icon="log-out-outline"
            onPress={logout}
            style={styles.logout}
          />
        ) : null}

        <Text style={styles.version}>Luxury Jewellery · v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 30, gap: 18 },
  hero: { padding: 20, borderRadius: radius.card, gap: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 21, fontWeight: '800', color: colors.champagne },
  heroText: { flex: 1, gap: 3 },
  heroName: { fontSize: 18, fontWeight: '700', color: colors.white },
  heroMeta: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 17 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.champagne },
  statLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.4 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  authRow: { flexDirection: 'row', gap: 10 },
  authBtn: { flex: 1 },
  sectionWrap: { gap: 9 },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    paddingLeft: 4,
  },
  menu: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuRowPressed: { backgroundColor: colors.primary50 },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  menuNote: { fontSize: 11.5, color: colors.textFaint },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.champagne,
  },
  infoText: { flex: 1, fontSize: 12.5, color: colors.primary700, lineHeight: 18 },
  logout: { alignSelf: 'stretch' },
  version: { textAlign: 'center', fontSize: 11, color: colors.textFaint },
});
