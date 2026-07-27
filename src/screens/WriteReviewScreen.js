import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/ui/Screen';
import AppHeader from '../components/ui/AppHeader';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { reviewAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';
import { colors, radius, shadows } from '../theme';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const MAX_PHOTOS = 5;

export default function WriteReviewScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { productId, productName, productImage, orderId } = params;
  const token = useAuthStore((s) => s.token);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const addPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Photo access is needed to attach images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets].slice(0, MAX_PHOTOS));
    }
  };

  const submit = async () => {
    if (!token) {
      toast.error('Please sign in to write a review');
      navigation.navigate('Login');
      return;
    }
    if (!rating) {
      toast.error('Please pick a star rating');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Tell us a little more — at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('product', productId);
      form.append('rating', String(rating));
      if (title.trim()) form.append('title', title.trim());
      form.append('comment', comment.trim());
      if (orderId) form.append('order', orderId);
      photos.forEach((photo, i) => {
        form.append('photos', {
          uri: photo.uri,
          name: photo.fileName || `review-${i}.jpg`,
          type: photo.mimeType || 'image/jpeg',
        });
      });

      await reviewAPI.create(form);
      toast.success('Thank you! Your review has been posted.');
      navigation.goBack();
    } catch (error) {
      toast.error(error?.message || 'Could not post your review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Write a Review" right={<View style={styles.spacer} />} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={70}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.productCard, shadows.xs]}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.productImage} contentFit="cover" />
            ) : (
              <View style={[styles.productImage, styles.productImageFallback]}>
                <Ionicons name="diamond-outline" size={20} color={colors.primary300} />
              </View>
            )}
            <Text numberOfLines={2} style={styles.productName}>
              {productName || 'This product'}
            </Text>
          </View>

          <View style={[styles.card, shadows.sm]}>
            <Text style={styles.cardTitle}>How would you rate it?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)} hitSlop={4}>
                  <Ionicons
                    name={s <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color={s <= rating ? colors.star : colors.primary200}
                  />
                </Pressable>
              ))}
            </View>
            {rating ? <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text> : null}
          </View>

          <View style={[styles.card, shadows.sm]}>
            <Field
              label="Headline"
              value={title}
              onChangeText={setTitle}
              placeholder="Sum it up in a few words"
            />
            <Field
              label="Your review"
              value={comment}
              onChangeText={setComment}
              placeholder="What did you like about the craftsmanship, finish, or fit?"
              multiline
            />

            <View style={styles.photoBlock}>
              <Text style={styles.photoLabel}>Photos (optional)</Text>
              <View style={styles.photoRow}>
                {photos.map((photo, i) => (
                  <View key={photo.uri} style={styles.thumbWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
                    <Pressable
                      onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      hitSlop={6}
                      style={styles.thumbRemove}
                    >
                      <Ionicons name="close" size={11} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <Pressable onPress={addPhotos} style={styles.addPhoto}>
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.addPhotoText}>Add</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Button label="Post review" loading={loading} onPress={submit} full />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { width: 38 },
  scroll: { padding: 16, gap: 14, paddingBottom: 36 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.primary50 },
  productImageFallback: { alignItems: 'center', justifyContent: 'center' },
  productName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.text, lineHeight: 19 },
  card: {
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 13,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  ratingLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.goldDark,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  photoBlock: { gap: 9 },
  photoLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.primary700,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 62, height: 62, borderRadius: radius.md, backgroundColor: colors.primary50 },
  thumbRemove: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 62,
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoText: { fontSize: 10, fontWeight: '700', color: colors.primary },
});
