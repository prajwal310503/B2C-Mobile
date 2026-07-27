import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, TOKEN_KEY } from '../services/api';
import { toast } from './toastStore';

const idOf = (p) => String(p?._id || p || '');

async function pushToServer(items) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return;
  try {
    await authAPI.setWishlist(items.map(idOf).filter(Boolean));
  } catch {
    // Local list stays authoritative until the next successful sync.
  }
}

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      syncing: false,

      syncFromServer: async () => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;
        set({ syncing: true });
        try {
          const { data } = await authAPI.getWishlist();
          const serverItems = data.data?.items || [];
          const byId = new Map();
          get().items.forEach((p) => byId.set(idOf(p), p));
          serverItems.forEach((p) => {
            const id = idOf(p);
            if (!id) return;
            byId.set(id, byId.has(id) ? { ...byId.get(id), ...p } : p);
          });
          const merged = [...byId.values()];
          set({ items: merged });
          await pushToServer(merged);
        } catch {
          // Offline or guest — keep whatever is stored locally.
        } finally {
          set({ syncing: false });
        }
      },

      addItem: async (product) => {
        if (get().items.some((i) => idOf(i) === idOf(product))) {
          toast.info('Already in wishlist');
          return;
        }
        const next = [...get().items, product];
        set({ items: next });
        toast.success('Added to wishlist');
        await pushToServer(next);
      },

      removeItem: async (product) => {
        const pid = idOf(product);
        const next = get().items.filter((i) => idOf(i) !== pid);
        set({ items: next });
        toast.success('Removed from wishlist');
        await pushToServer(next);
      },

      toggleItem: async (product) => {
        const isIn = get().items.some((i) => idOf(i) === idOf(product));
        if (isIn) await get().removeItem(product);
        else await get().addItem(product);
        return !isIn;
      },

      isInWishlist: (id) => get().items.some((i) => idOf(i) === idOf(id)),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'luxury-wishlist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useWishlistStore;
