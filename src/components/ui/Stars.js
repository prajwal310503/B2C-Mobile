import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function Stars({ rating = 0, count, size = 12, showCount = true }) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rounded ? 'star' : 'star-outline'}
          size={size}
          color={s <= rounded ? colors.star : colors.primary200}
        />
      ))}
      {showCount && count > 0 ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1.5 },
  count: { marginLeft: 5, fontSize: 11, color: colors.textFaint, fontWeight: '500' },
});
