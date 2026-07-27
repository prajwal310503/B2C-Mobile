import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { supportAPI } from '../services/api';
import { toast } from '../store/toastStore';
import { colors, radius, shadows } from '../theme';

const REASONS = ['Order issue', 'Payment', 'Delivery', 'Product quality', 'Other'];

const TICKET_STATUS = {
  open: { bg: '#e0f2fe', color: '#0369a1' },
  pending: { bg: '#fef3c7', color: '#b45309' },
  resolved: { bg: '#dcfce7', color: '#15803d' },
  closed: { bg: '#f3f4f6', color: '#4b5563' },
};

export default function SupportScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () =>
    supportAPI
      .getMyTickets()
      .then(({ data }) => setTickets(data.data || []))
      .catch(() => setTickets([]));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please add a subject and message');
      return;
    }
    setSubmitting(true);
    try {
      await supportAPI.create({ subject: subject.trim(), body: body.trim(), reason });
      toast.success('Ticket submitted — we will reply soon');
      setSubject('');
      setBody('');
      setComposing(false);
      await load();
    } catch (error) {
      toast.error(error?.message || 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <AppHeader
        title="Help & Support"
        right={
          <Pressable onPress={() => setComposing((c) => !c)} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name={composing ? 'close' : 'add'} size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={70}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {composing ? (
            <View style={[styles.card, shadows.xs]}>
              <Text style={styles.cardTitle}>Raise a ticket</Text>

              <View style={styles.reasonRow}>
                {REASONS.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                  >
                    <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Field
                label="Subject"
                value={subject}
                onChangeText={setSubject}
                placeholder="Briefly describe the issue"
              />
              <Field
                label="Message"
                value={body}
                onChangeText={setBody}
                placeholder="Tell us what happened…"
                multiline
              />
              <Button label="Submit ticket" loading={submitting} onPress={submit} full />
            </View>
          ) : (
            <View style={[styles.helpCard, shadows.xs]}>
              <Ionicons name="headset-outline" size={22} color={colors.goldDark} />
              <View style={styles.flex}>
                <Text style={styles.helpTitle}>We're here to help</Text>
                <Text style={styles.helpNote}>
                  Raise a ticket and our concierge replies within 24 hours.
                </Text>
              </View>
              <Button label="New" size="sm" onPress={() => setComposing(true)} />
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : tickets.length ? (
            <View style={styles.ticketList}>
              <Text style={styles.sectionLabel}>Your tickets</Text>
              {tickets.map((t) => {
                const status = TICKET_STATUS[t.status] || TICKET_STATUS.open;
                const open = expanded === t._id;
                return (
                  <Pressable
                    key={t._id}
                    onPress={() => setExpanded(open ? null : t._id)}
                    style={[styles.ticket, shadows.xs]}
                  >
                    <View style={styles.ticketHead}>
                      <Text numberOfLines={1} style={styles.ticketSubject}>
                        {t.subject}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{t.status}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={open ? undefined : 2} style={styles.ticketBody}>
                      {t.body}
                    </Text>
                    {open && t.replies?.length ? (
                      <View style={styles.replies}>
                        {t.replies.map((r, i) => (
                          <View
                            key={i}
                            style={[styles.reply, r.by === 'user' ? styles.replyUser : styles.replyTeam]}
                          >
                            <Text style={styles.replyBy}>
                              {r.by === 'user' ? 'You' : 'Support team'}
                            </Text>
                            <Text style={styles.replyText}>{r.message}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="No tickets yet"
              message="If something needs attention, raise a ticket and we'll sort it out."
              actionLabel="Raise a ticket"
              onAction={() => setComposing(true)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 16, paddingBottom: 30 },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  reasonChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  reasonText: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  reasonTextActive: { color: colors.white },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  helpNote: { fontSize: 11.5, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  loader: { marginTop: 26 },
  ticketList: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  ticket: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 7,
  },
  ticketHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketSubject: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.text },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  ticketBody: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  replies: { gap: 8, marginTop: 6 },
  reply: { padding: 11, borderRadius: radius.md, gap: 3 },
  replyUser: { backgroundColor: colors.primary50 },
  replyTeam: { backgroundColor: colors.champagne },
  replyBy: { fontSize: 10, fontWeight: '800', color: colors.goldDark, letterSpacing: 0.4 },
  replyText: { fontSize: 12.5, color: colors.text, lineHeight: 18 },
});
