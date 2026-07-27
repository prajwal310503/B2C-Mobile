import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { colors, radius, shadows } from '../theme';

const EMPTY = {
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

const LABELS = ['Home', 'Work', 'Other'];

export default function AddressesScreen() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editIndex, setEditIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  const persist = async (next) => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateAddresses(next);
      const updated = data.data?.addresses || next;
      setAddresses(updated);
      updateUser({ ...user, addresses: updated });
      setEditing(null);
      toast.success('Addresses updated');
    } catch (error) {
      toast.error(error?.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const validate = (form) => {
    const next = {};
    if (!form.fullName?.trim()) next.fullName = 'Required';
    if (!/^\d{10}$/.test(String(form.phone || '').replace(/\D/g, ''))) next.phone = '10-digit number';
    if (!form.addressLine1?.trim()) next.addressLine1 = 'Required';
    if (!form.city?.trim()) next.city = 'Required';
    if (!form.state?.trim()) next.state = 'Required';
    if (!/^\d{6}$/.test(String(form.pincode || ''))) next.pincode = '6-digit pincode';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate(editing)) return;
    const next = [...addresses];
    if (editIndex >= 0) next[editIndex] = editing;
    else next.push(editing);

    const savedIndex = editIndex >= 0 ? editIndex : next.length - 1;
    persist(
      editing.isDefault
        ? next.map((a, i) => ({ ...a, isDefault: i === savedIndex }))
        : next
    );
  };

  const remove = (index) => persist(addresses.filter((_, i) => i !== index));

  const makeDefault = (index) =>
    persist(addresses.map((a, i) => ({ ...a, isDefault: i === index })));

  const openNew = () => {
    setEditing({ ...EMPTY, fullName: user?.name || '', phone: user?.phone || '' });
    setEditIndex(-1);
    setErrors({});
  };

  const openEdit = (address, index) => {
    setEditing({ ...EMPTY, ...address });
    setEditIndex(index);
    setErrors({});
  };

  const setField = (key, value) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <Screen>
      <AppHeader
        title="Saved Addresses"
        right={
          <Pressable onPress={openNew} hitSlop={8} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {addresses.length ? (
          addresses.map((a, i) => (
            <View key={`${a.pincode}-${i}`} style={[styles.card, shadows.xs]}>
              <View style={styles.cardHead}>
                <View style={styles.labelPill}>
                  <Ionicons
                    name={a.label === 'Work' ? 'briefcase-outline' : 'home-outline'}
                    size={12}
                    color={colors.goldDark}
                  />
                  <Text style={styles.labelText}>{a.label || 'Home'}</Text>
                </View>
                {a.isDefault ? (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.name}>{a.fullName}</Text>
              <Text style={styles.body}>
                {[a.addressLine1, a.addressLine2, a.city, a.state, a.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              <Text style={styles.body}>Phone: {a.phone}</Text>

              <View style={styles.cardActions}>
                <Pressable onPress={() => openEdit(a, i)} style={styles.action}>
                  <Ionicons name="create-outline" size={15} color={colors.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                {!a.isDefault ? (
                  <Pressable onPress={() => makeDefault(i)} style={styles.action}>
                    <Ionicons name="star-outline" size={15} color={colors.primary} />
                    <Text style={styles.actionText}>Set default</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => remove(i)} style={styles.action}>
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  <Text style={[styles.actionText, styles.actionDanger]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="location-outline"
            title="No saved addresses"
            message="Add an address once and reuse it at every checkout."
            actionLabel="Add address"
            onAction={openNew}
          />
        )}
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetWrap}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>
                  {editIndex >= 0 ? 'Edit address' : 'New address'}
                </Text>
                <Pressable onPress={() => setEditing(null)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.labelRow}>
                  {LABELS.map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => setField('label', l)}
                      style={[styles.labelChip, editing?.label === l && styles.labelChipActive]}
                    >
                      <Text
                        style={[
                          styles.labelChipText,
                          editing?.label === l && styles.labelChipTextActive,
                        ]}
                      >
                        {l}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Field
                  label="Full name"
                  value={editing?.fullName}
                  onChangeText={(t) => setField('fullName', t)}
                  error={errors.fullName}
                  icon="person-outline"
                />
                <Field
                  label="Phone"
                  value={String(editing?.phone || '')}
                  onChangeText={(t) => setField('phone', t.replace(/[^0-9]/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  error={errors.phone}
                  icon="call-outline"
                />
                <Field
                  label="Address line 1"
                  value={editing?.addressLine1}
                  onChangeText={(t) => setField('addressLine1', t)}
                  error={errors.addressLine1}
                  icon="home-outline"
                />
                <Field
                  label="Address line 2 (optional)"
                  value={editing?.addressLine2}
                  onChangeText={(t) => setField('addressLine2', t)}
                />
                <View style={styles.formRow}>
                  <View style={styles.flex}>
                    <Field
                      label="City"
                      value={editing?.city}
                      onChangeText={(t) => setField('city', t)}
                      error={errors.city}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Field
                      label="State"
                      value={editing?.state}
                      onChangeText={(t) => setField('state', t)}
                      error={errors.state}
                    />
                  </View>
                </View>
                <Field
                  label="Pincode"
                  value={String(editing?.pincode || '')}
                  onChangeText={(t) => setField('pincode', t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  error={errors.pincode}
                  icon="location-outline"
                />

                <Pressable
                  onPress={() => setField('isDefault', !editing?.isDefault)}
                  style={styles.checkboxRow}
                >
                  <Ionicons
                    name={editing?.isDefault ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={editing?.isDefault ? colors.primary : colors.textFaint}
                  />
                  <Text style={styles.checkboxText}>Set as default address</Text>
                </Pressable>

                <Button label="Save address" loading={saving} onPress={save} full />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 30 },
  card: {
    padding: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.champagne,
  },
  labelText: { fontSize: 10.5, fontWeight: '700', color: colors.goldDark },
  defaultPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary50,
  },
  defaultText: { fontSize: 10.5, fontWeight: '700', color: colors.primary },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  body: { fontSize: 12.5, color: colors.textMuted, lineHeight: 19 },
  cardActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 9,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  actionDanger: { color: colors.danger },
  backdrop: { flex: 1, backgroundColor: 'rgba(52,37,35,0.45)', justifyContent: 'flex-end' },
  sheetWrap: { maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 16,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 34, gap: 13 },
  labelRow: { flexDirection: 'row', gap: 8 },
  labelChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  labelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  labelChipText: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  labelChipTextActive: { color: colors.white },
  formRow: { flexDirection: 'row', gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 },
  checkboxText: { fontSize: 13, color: colors.text },
});
