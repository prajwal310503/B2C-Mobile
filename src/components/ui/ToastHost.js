import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useToastStore from '../../store/toastStore';
import { colors, radius, shadows } from '../../theme';

const VARIANTS = {
  success: { icon: 'checkmark-circle', color: colors.successDark, bg: '#ecfdf5', border: '#a7f3d0' },
  error: { icon: 'alert-circle', color: colors.danger, bg: '#fff1f2', border: '#fecdd3' },
  info: { icon: 'information-circle', color: colors.primary, bg: colors.surfaceAlt, border: colors.border },
};

function ToastItem({ toast }) {
  const anim = useRef(new Animated.Value(0)).current;
  const variant = VARIANTS[toast.type] || VARIANTS.info;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 90 }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.toast,
        shadows.md,
        { backgroundColor: variant.bg, borderColor: variant.border },
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <Ionicons name={variant.icon} size={19} color={variant.color} />
      <Text style={[styles.text, { color: variant.color }]} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  text: { flex: 1, fontSize: 13.5, fontWeight: '600' },
});
