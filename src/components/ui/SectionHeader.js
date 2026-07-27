import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme';

export default function SectionHeader({ eyebrow, title, subtitle, actionLabel, onAction, align = 'left' }) {
  const centered = align === 'center';
  return (
    <View style={[styles.wrap, centered && styles.centered]}>
      <View style={[styles.textCol, centered && styles.centered]}>
        {eyebrow ? <Text style={typography.eyebrow}>{eyebrow}</Text> : null}
        <Text style={[styles.title, centered && styles.centerText]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, centered && styles.centerText]}>{subtitle}</Text>
        ) : null}
        <View style={[styles.rule, centered && styles.ruleCentered]} />
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1, gap: 5 },
  centerText: { textAlign: 'center' },
  title: { fontSize: 21, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  rule: { width: 42, height: 2, borderRadius: 2, backgroundColor: colors.gold, marginTop: 4 },
  ruleCentered: { alignSelf: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 8 },
  actionText: { fontSize: 12.5, fontWeight: '700', color: colors.primary, letterSpacing: 0.3 },
});
