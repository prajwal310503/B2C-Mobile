import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

/**
 * Page shell with the storefront's warm cream backdrop.
 * `edges` defaults to top-only so tab bars can own the bottom inset.
 */
export default function Screen({ children, edges = ['top'], plain = false, style }) {
  if (plain) {
    return (
      <SafeAreaView edges={edges} style={[styles.plain, style]}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.cream, colors.beige, colors.cream]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  safe: { flex: 1 },
  plain: { flex: 1, backgroundColor: colors.white },
});
