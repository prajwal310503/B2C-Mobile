import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

export function Skeleton({ width, height = 14, style, round = radius.sm }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: round, backgroundColor: colors.primary100 },
        { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }) },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton({ width }) {
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton width="100%" height={width} round={0} />
      <View style={styles.body}>
        <Skeleton width="55%" height={9} />
        <Skeleton width="90%" height={13} />
        <Skeleton width="45%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { padding: 12, gap: 8 },
});

export default Skeleton;
