import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, radius } from '../../theme';

export default function EmptyState({ icon = 'sparkles-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[colors.champagne, colors.blush]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
      >
        <Ionicons name={icon} size={34} color={colors.goldDark} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 36, paddingVertical: 56, gap: 10 },
  badge: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: 10, minWidth: 190 },
});
