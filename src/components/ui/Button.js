import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, shadows } from '../../theme';

const SIZES = {
  sm: { height: 38, paddingHorizontal: 16, fontSize: 13, icon: 15 },
  md: { height: 48, paddingHorizontal: 22, fontSize: 15, icon: 17 },
  lg: { height: 56, paddingHorizontal: 26, fontSize: 16, icon: 19 },
};

function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  full = false,
  style,
}) {
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  const handlePress = (e) => {
    if (isDisabled) return;
    Haptics.selectionAsync().catch(() => {});
    onPress?.(e);
  };

  const tint =
    variant === 'outline' || variant === 'ghost'
      ? colors.primary
      : variant === 'gold'
        ? colors.primary900
        : colors.white;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={s.icon} color={tint} style={styles.iconLeft} /> : null}
          <Text
            numberOfLines={1}
            style={[styles.label, { fontSize: s.fontSize, color: tint }]}
          >
            {label}
          </Text>
          {iconRight ? (
            <Ionicons name={iconRight} size={s.icon} color={tint} style={styles.iconRight} />
          ) : null}
        </>
      )}
    </View>
  );

  const frame = [
    styles.base,
    { height: s.height, paddingHorizontal: s.paddingHorizontal },
    full && styles.full,
  ];

  if (variant === 'primary' || variant === 'gold' || variant === 'danger') {
    const palette =
      variant === 'gold' ? gradients.gold : variant === 'danger' ? gradients.danger : gradients.primary;
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          full && styles.full,
          variant === 'gold' ? shadows.gold : shadows.sm,
          { opacity: isDisabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] },
          style,
        ]}
      >
        <LinearGradient
          colors={isDisabled ? gradients.muted : palette}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={frame}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        frame,
        variant === 'outline' ? styles.outline : styles.ghost,
        { opacity: isDisabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch', width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', letterSpacing: 0.2 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  ghost: { backgroundColor: 'transparent' },
});

export default memo(Button);
