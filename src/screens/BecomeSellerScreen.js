import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import SectionHeader from '../components/ui/SectionHeader';
import { colors, radius, shadows } from '../theme';

const STATS = [
  { value: '10,000+', label: 'Active Buyers' },
  { value: '500+', label: 'Sold Monthly' },
  { value: '48 hrs', label: 'Approval Time' },
  { value: '0%', label: 'Listing Fee' },
];

const BENEFITS = [
  {
    icon: 'storefront-outline',
    accent: colors.gold,
    title: 'Your Own Store Page',
    desc: 'A dedicated, branded storefront with your logo, banner, and catalogue visible to thousands of buyers.',
  },
  {
    icon: 'stats-chart-outline',
    accent: colors.roseGold,
    title: 'Real-Time Dashboard',
    desc: 'Monitor sales, orders, revenue, and top-selling products from a single intuitive vendor dashboard.',
  },
  {
    icon: 'sync-outline',
    accent: colors.primary,
    title: 'Live Metal Price Sync',
    desc: "Product prices auto-update with today's live gold, silver, and platinum rates — no manual work.",
  },
  {
    icon: 'pricetags-outline',
    accent: colors.sage,
    title: 'Full Product Control',
    desc: 'Unlimited products with variants — size, weight, purity, metal colour — plus making charges and certifications.',
  },
  {
    icon: 'people-outline',
    accent: colors.terracotta,
    title: 'Reach More Buyers',
    desc: 'Tap into our growing customer base across India. Your products get featured on the marketplace homepage.',
  },
  {
    icon: 'shield-checkmark-outline',
    accent: colors.slate,
    title: 'Secure & Transparent',
    desc: 'Secure payments, a transparent commission structure, and dedicated support to help you grow.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Register Your Shop',
    desc: 'Fill in your jewellery shop details, GST number, and business information.',
  },
  {
    step: '02',
    title: 'Get Approved',
    desc: 'Our team reviews your application and activates your store within 24–48 hours.',
  },
  {
    step: '03',
    title: 'List Your Products',
    desc: 'Upload jewellery with photos, variants, and pricing — all from your vendor panel.',
  },
  {
    step: '04',
    title: 'Start Selling',
    desc: 'Receive orders, manage deliveries, and track earnings in real time.',
  },
];

const INCLUSIONS = [
  'Branded vendor storefront',
  'Unlimited product listings',
  'Live metal price sync',
  'Order & payment management',
  'Real-time sales dashboard',
  'Making charges per category',
];

export default function BecomeSellerScreen() {
  const navigation = useNavigation();

  return (
    <Screen>
      <AppHeader title="Become a Seller" right={<View style={styles.spacer} />} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary800, colors.primary900]}
          style={[styles.hero, shadows.md]}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={11} color={colors.champagne} />
            <Text style={styles.heroBadgeText}>Vendor Partnership</Text>
          </View>
          <Text style={styles.heroTitle}>Grow Your Jewellery</Text>
          <Text style={styles.heroTitleGold}>Business Online</Text>
          <Text style={styles.heroBody}>
            Join India&apos;s trusted multi-vendor jewellery marketplace. Zero listing fees, live
            metal price sync, and your own branded storefront.
          </Text>

          <Button
            label="Register Your Shop"
            variant="gold"
            icon="arrow-forward"
            onPress={() => navigation.navigate('VendorRegister')}
            full
          />

          <View style={styles.statGrid}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.block}>
          <SectionHeader
            eyebrow="Why sell with us"
            title="Everything You Need to Sell"
            subtitle="A complete platform designed specifically for jewellery shops — from listing to delivery."
          />
          <View style={styles.benefitList}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={[styles.benefitCard, shadows.xs]}>
                <View style={[styles.benefitIcon, { backgroundColor: `${b.accent}1f` }]}>
                  <Ionicons name={b.icon} size={19} color={b.accent} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{b.title}</Text>
                  <Text style={styles.benefitDesc}>{b.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <SectionHeader eyebrow="Simple process" title="How It Works" />
          <View style={styles.stepList}>
            {STEPS.map((s, i) => (
              <View key={s.step} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={styles.stepDot}>
                    <Text style={styles.stepNumber}>{s.step}</Text>
                  </View>
                  {i < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <SectionHeader
            eyebrow="No hidden charges"
            title="Everything Included"
            subtitle="Everything listed below comes with your vendor account."
          />
          <View style={[styles.inclusionCard, shadows.xs]}>
            {INCLUSIONS.map((item) => (
              <View key={item} style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={17} color={colors.sage} />
                <Text style={styles.inclusionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={[colors.primary700, colors.primary900]} style={styles.cta}>
          <Text style={styles.ctaTitle}>Start Selling Today</Text>
          <Text style={styles.ctaBody}>
            Registration takes under five minutes. Complete KYC after you sign in.
          </Text>
          <Button
            label="Create Vendor Account"
            variant="gold"
            onPress={() => navigation.navigate('VendorRegister')}
            full
          />
        </LinearGradient>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { width: 38 },
  scroll: { paddingBottom: 34 },
  hero: {
    margin: 16,
    padding: 22,
    borderRadius: radius.card,
    gap: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(226,201,126,0.16)',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.champagne,
  },
  heroTitle: { fontSize: 27, fontWeight: '800', color: colors.white, lineHeight: 33 },
  heroTitleGold: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.champagne,
    lineHeight: 33,
    marginTop: -4,
  },
  heroBody: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 21,
    marginBottom: 8,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  stat: { width: '50%', paddingVertical: 9, gap: 2 },
  statValue: { fontSize: 19, fontWeight: '800', color: colors.white },
  statLabel: {
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
  },
  block: { marginTop: 26 },
  benefitList: { paddingHorizontal: 16, gap: 11 },
  benefitCard: {
    flexDirection: 'row',
    gap: 13,
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, gap: 4 },
  benefitTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  benefitDesc: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  stepList: { paddingHorizontal: 16 },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepRail: { alignItems: 'center', width: 40 },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
    borderWidth: 1.5,
    borderColor: colors.primary200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontSize: 12.5, fontWeight: '800', color: colors.primary },
  stepLine: { flex: 1, width: 1.5, backgroundColor: colors.primary200, marginVertical: 4 },
  stepBody: { flex: 1, paddingBottom: 22, gap: 4 },
  stepTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text, marginTop: 8 },
  stepDesc: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  inclusionCard: {
    marginHorizontal: 16,
    padding: 17,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  inclusionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inclusionText: { flex: 1, fontSize: 13.5, color: colors.text },
  cta: {
    margin: 16,
    marginTop: 28,
    padding: 22,
    borderRadius: radius.card,
    gap: 9,
  },
  ctaTitle: { fontSize: 21, fontWeight: '800', color: colors.white },
  ctaBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.66)',
    lineHeight: 20,
    marginBottom: 8,
  },
});
