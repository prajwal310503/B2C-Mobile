import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import { colors, radius, shadows } from '../../theme';

export const PRICE_RANGES = [
  { label: 'Below ₹15K', min: 0, max: 15000 },
  { label: '₹15K – ₹30K', min: 15000, max: 30000 },
  { label: '₹30K – ₹50K', min: 30000, max: 50000 },
  { label: '₹50K – ₹75K', min: 50000, max: 75000 },
  { label: '₹75K – ₹1L', min: 75000, max: 100000 },
  { label: '₹1L – ₹2L', min: 100000, max: 200000 },
  { label: '₹2L – ₹5L', min: 200000, max: 500000 },
  { label: '₹5L+', min: 500000, max: null },
];

export const SORTS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'popular', label: 'Most popular' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

/** Price min+max together count as a single filter, matching the web sidebar. */
export function countActiveFilters(filters = {}) {
  let count = 0;
  let priceCounted = false;
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'sort' || key === 'page') return;
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && !value.length) return;
    if (key === 'minPrice' || key === 'maxPrice') {
      if (!priceCounted) {
        count += 1;
        priceCounted = true;
      }
      return;
    }
    count += 1;
  });
  return count;
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function Option({ label, selected, multi, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.option}>
      <Ionicons
        name={
          multi
            ? selected
              ? 'checkbox'
              : 'square-outline'
            : selected
              ? 'radio-button-on'
              : 'radio-button-off'
        }
        size={19}
        color={selected ? colors.primary : colors.textFaint}
      />
      <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function FilterSheet({ visible, onClose, filters, attributes = [], stores = [], onApply }) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const filterable = attributes.filter((a) => a.isFilterable && a.values?.length > 0);

  const togglePrice = (range) => {
    const active =
      draft.minPrice === range.min &&
      (range.max != null ? draft.maxPrice === range.max : draft.maxPrice == null);
    setDraft((d) => ({
      ...d,
      minPrice: active ? undefined : range.min,
      maxPrice: active ? undefined : range.max ?? undefined,
    }));
  };

  const toggleStore = (slug) =>
    setDraft((d) => ({ ...d, store: d.store === slug ? undefined : slug }));

  const toggleAttribute = (attrSlug, valueId) => {
    const key = `attr_${attrSlug}`;
    setDraft((d) => {
      const current = Array.isArray(d[key]) ? d[key] : d[key] ? [d[key]] : [];
      const id = String(valueId);
      const next = current.map(String).includes(id)
        ? current.filter((v) => String(v) !== id)
        : [...current, id];
      return { ...d, [key]: next.length ? next : undefined };
    });
  };

  const activeCount = countActiveFilters(draft);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.headTitle}>
              Filters{activeCount ? ` (${activeCount})` : ''}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Section title="Sort by" defaultOpen>
              {SORTS.map((s) => (
                <Option
                  key={s.key}
                  label={s.label}
                  selected={draft.sort === s.key}
                  onPress={() => setDraft((d) => ({ ...d, sort: s.key }))}
                />
              ))}
            </Section>

            <Section title="Price" defaultOpen>
              {PRICE_RANGES.map((range) => (
                <Option
                  key={range.label}
                  label={range.label}
                  selected={
                    draft.minPrice === range.min &&
                    (range.max != null ? draft.maxPrice === range.max : draft.maxPrice == null)
                  }
                  onPress={() => togglePrice(range)}
                />
              ))}
            </Section>

            {stores.length ? (
              <Section title="Boutique">
                {stores.map((s) => (
                  <Option
                    key={s._id}
                    label={s.name}
                    selected={draft.store === s.slug}
                    onPress={() => toggleStore(s.slug)}
                  />
                ))}
              </Section>
            ) : null}

            {filterable.map((attr) => {
              const key = `attr_${attr.slug}`;
              const selected = Array.isArray(draft[key]) ? draft[key].map(String) : [];
              return (
                <Section key={attr._id} title={attr.name}>
                  {attr.values.map((v) => (
                    <Option
                      key={v._id}
                      multi
                      label={v.value || v.name}
                      selected={selected.includes(String(v._id))}
                      onPress={() => toggleAttribute(attr.slug, v._id)}
                    />
                  ))}
                </Section>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, shadows.lg]}>
            <Button
              label="Reset"
              variant="outline"
              onPress={() => setDraft({ sort: 'newest' })}
              style={styles.footerBtn}
            />
            <Button
              label="Show results"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(52,37,35,0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  section: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sectionTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text, letterSpacing: 0.2 },
  sectionBody: { paddingBottom: 10, gap: 2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  optionLabel: { fontSize: 13.5, color: colors.textMuted, flex: 1 },
  optionLabelActive: { color: colors.text, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerBtn: { flex: 1 },
});
