import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const RING_SIZES = [
  { diameterIn: 0.56, circumferenceIn: 1.77, ind: 5, us: 3 },
  { diameterIn: 0.58, circumferenceIn: 1.82, ind: 6, us: 3.5 },
  { diameterIn: 0.59, circumferenceIn: 1.87, ind: 7, us: 4 },
  { diameterIn: 0.6, circumferenceIn: 1.89, ind: 8, us: 4.5 },
  { diameterIn: 0.61, circumferenceIn: 1.92, ind: 9, us: 5 },
  { diameterIn: 0.63, circumferenceIn: 1.97, ind: 10, us: 5.5 },
  { diameterIn: 0.64, circumferenceIn: 2.02, ind: 11, us: 6 },
  { diameterIn: 0.65, circumferenceIn: 2.04, ind: 12, us: 6.5 },
  { diameterIn: 0.67, circumferenceIn: 2.09, ind: 13, us: 7 },
  { diameterIn: 0.68, circumferenceIn: 2.14, ind: 14, us: 7.5 },
  { diameterIn: 0.69, circumferenceIn: 2.16, ind: 15, us: 8 },
  { diameterIn: 0.7, circumferenceIn: 2.21, ind: 16, us: 8.5 },
  { diameterIn: 0.71, circumferenceIn: 2.24, ind: 17, us: 9 },
  { diameterIn: 0.73, circumferenceIn: 2.29, ind: 18, us: 9.5 },
  { diameterIn: 0.74, circumferenceIn: 2.34, ind: 19, us: 10 },
  { diameterIn: 0.76, circumferenceIn: 2.39, ind: 20, us: 10.5 },
  { diameterIn: 0.77, circumferenceIn: 2.41, ind: 21, us: 11 },
  { diameterIn: 0.78, circumferenceIn: 2.46, ind: 22, us: 11.5 },
  { diameterIn: 0.8, circumferenceIn: 2.51, ind: 23, us: 12 },
  { diameterIn: 0.81, circumferenceIn: 2.56, ind: 24, us: 12.5 },
  { diameterIn: 0.83, circumferenceIn: 2.61, ind: 25, us: 13 },
  { diameterIn: 0.84, circumferenceIn: 2.63, ind: 26, us: 13.5 },
];

const IN_TO_MM = 25.4;
const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(SCREEN_W * 0.92, 420);

function fmt(n, decimals) {
  return Number(n).toFixed(decimals);
}

export default function SizeGuideModal({ open, onClose }) {
  const insets = useSafeAreaInsets();
  const [unit, setUnit] = useState('inch');
  const [visible, setVisible] = useState(false);
  const slideX = useRef(new Animated.Value(DRAWER_W)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const isMm = unit === 'mm';

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideX, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideX, { toValue: DRAWER_W, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_W,
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Size Guide</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#111" />
            </Pressable>
          </View>

          <View style={styles.tabs}>
            {['inch', 'mm'].map((u) => (
              <Pressable key={u} onPress={() => setUnit(u)} style={styles.tab}>
                <Text style={[styles.tabText, unit === u && styles.tabTextActive]}>{u}</Text>
                {unit === u ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDia]}>
              {isMm ? 'Diameter (mm)' : 'Diameter (in)'}
            </Text>
            <Text style={[styles.th, styles.colCirc]}>Circumference</Text>
            <Text style={[styles.th, styles.colInd]}>IND</Text>
            <Text style={[styles.th, styles.colUs]}>US</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator>
            {RING_SIZES.map((row) => {
              const diameter = isMm
                ? fmt(row.diameterIn * IN_TO_MM, 1)
                : fmt(row.diameterIn, 2);
              const circ = isMm
                ? fmt(row.circumferenceIn * IN_TO_MM, 1)
                : fmt(row.circumferenceIn, 2);
              return (
                <View key={row.ind} style={styles.row}>
                  <Text style={[styles.td, styles.colDia]}>{diameter}</Text>
                  <Text style={[styles.td, styles.colCirc]}>{circ}</Text>
                  <Text style={[styles.td, styles.colInd]}>{row.ind}</Text>
                  <Text style={[styles.td, styles.colUs]}>{row.us}</Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: -4, height: 0 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  closeBtn: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  tab: { paddingBottom: 10, position: 'relative' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#9ca3af', textTransform: 'lowercase' },
  tabTextActive: { fontWeight: '700', color: '#111' },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: '#111',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  th: { fontSize: 12, fontWeight: '700', color: '#111' },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  td: { fontSize: 13, color: '#1f2937' },
  colDia: { flex: 1.35 },
  colCirc: { flex: 1.1, textAlign: 'center' },
  colInd: { width: 40, textAlign: 'center' },
  colUs: { width: 44, textAlign: 'center' },
});
