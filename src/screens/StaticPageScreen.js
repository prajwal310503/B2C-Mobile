import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { supportAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { colors, radius, shadows } from '../theme';

export const CONTACT = {
  email: 'care@vkjewellers.com',
  phone: '+91 9004436052',
  address: 'Mumbai, Maharashtra, India',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Mumbai,Maharashtra,India',
};

export const PAGES = {
  about: {
    title: 'About Us',
    content: `VK Jewellers is a multi-vendor jewellery marketplace connecting India's finest jewellery shops with customers nationwide. We curate certified gold, diamond, and gemstone pieces from trusted artisans and established brands.

Our platform combines traditional craftsmanship with modern convenience — browse hundreds of shops, compare designs, and checkout securely from one place.`,
  },
  contact: {
    title: 'Contact Us',
    showForm: true,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `We collect information you provide when registering, placing orders, or contacting us. This includes name, email, phone, and shipping address.

We use your data to process orders, improve our services, and send transactional communications. We do not sell your personal information to third parties.

Payment data is processed securely through Razorpay. We retain order history as required for legal and accounting purposes.`,
  },
  terms: {
    title: 'Terms & Conditions',
    content: `By using VK Jewellers marketplace you agree to these terms. Each vendor is responsible for their listed products, pricing accuracy, and order fulfillment.

Orders are subject to availability. Returns and exchanges follow individual shop policies and platform guidelines.`,
  },
  faq: {
    title: 'FAQ',
    faqs: [
      {
        q: 'How does multi-vendor checkout work?',
        a: 'Add items from any shop to one cart. At checkout, we split your order by shop — each vendor fulfills their portion separately.',
      },
      {
        q: 'Are products certified?',
        a: 'Vendors list BIS-hallmarked gold and IGI/GIA certified diamonds where applicable. Check product details for certification info.',
      },
      {
        q: 'How do I track my order?',
        a: 'Go to My Orders — each shop order shows its own status and tracking when shipped.',
      },
      {
        q: 'Can I apply a coupon?',
        a: 'Enter your code at checkout. Platform and shop-specific coupons may apply.',
      },
    ],
  },
  shipping: {
    title: 'Shipping Policy',
    content: `Standard delivery takes 5–10 business days depending on the vendor and your location. Insured shipping is available on high-value orders. Each shop may have specific shipping timelines shown on product pages.`,
  },
};

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={[styles.faqCard, shadows.xs]}>
      <View style={styles.faqHead}>
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </View>
      {open ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
    </Pressable>
  );
}

function ContactBlock() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const open = (url) => Linking.openURL(url).catch(() => {});

  const send = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error('Please add your name and a message');
      return;
    }

    // Signed-in users get a trackable ticket; guests fall back to their mail client.
    if (!token) {
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      open(`mailto:${CONTACT.email}?subject=${encodeURIComponent('Website enquiry')}&body=${body}`);
      return;
    }

    setSending(true);
    try {
      await supportAPI.create({
        subject: `Enquiry from ${name.trim()}`,
        body: message.trim(),
        reason: 'Other',
      });
      toast.success('Thank you! We will get back to you soon.');
      setMessage('');
    } catch (error) {
      toast.error(error?.message || 'Could not send your enquiry');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.contactWrap}>
      <View style={[styles.card, shadows.xs]}>
        <Pressable onPress={() => open(`mailto:${CONTACT.email}`)} style={styles.contactRow}>
          <View style={styles.contactIcon}>
            <Ionicons name="mail-outline" size={17} color={colors.goldDark} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{CONTACT.email}</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.textFaint} />
        </Pressable>

        <Pressable onPress={() => open(`tel:${CONTACT.phone}`)} style={styles.contactRow}>
          <View style={styles.contactIcon}>
            <Ionicons name="call-outline" size={17} color={colors.goldDark} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>{CONTACT.phone}</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.textFaint} />
        </Pressable>

        <Pressable onPress={() => open(CONTACT.mapLink)} style={styles.contactRow}>
          <View style={styles.contactIcon}>
            <Ionicons name="location-outline" size={17} color={colors.goldDark} />
          </View>
          <View style={styles.contactText}>
            <Text style={styles.contactLabel}>Address</Text>
            <Text style={styles.contactValue}>{CONTACT.address}</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.textFaint} />
        </Pressable>
      </View>

      <View style={[styles.card, shadows.xs]}>
        <Text style={styles.cardTitle}>Send an enquiry</Text>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="How can we help?"
          multiline
        />
        <Button label="Send Enquiry" loading={sending} onPress={send} full />
      </View>
    </View>
  );
}

export default function StaticPageScreen() {
  const { params = {} } = useRoute();
  const page = PAGES[params.pageKey] || PAGES.about;

  return (
    <Screen>
      <AppHeader title={page.title} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={70}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {page.content ? (
            <View style={[styles.card, shadows.xs]}>
              {page.content.split(/\n{2,}/).map((paragraph, i) => (
                <Text key={i} style={styles.paragraph}>
                  {paragraph.trim()}
                </Text>
              ))}
            </View>
          ) : null}

          {page.faqs ? (
            <View style={styles.faqList}>
              {page.faqs.map((f) => (
                <FaqItem key={f.q} item={f} />
              ))}
            </View>
          ) : null}

          {page.showForm ? <ContactBlock /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 34 },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  paragraph: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  faqList: { gap: 10 },
  faqCard: {
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 9,
  },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQuestion: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text, lineHeight: 19 },
  faqAnswer: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  contactWrap: { gap: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { flex: 1, gap: 2 },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  contactValue: { fontSize: 13.5, fontWeight: '600', color: colors.text },
});
