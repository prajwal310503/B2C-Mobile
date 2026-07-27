import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from './toastStore';

function stockOf(product) {
  const n = Number(product?.stock);
  return Number.isFinite(n) ? n : 0;
}

function priceOf(product) {
  return product?.discountedPrice ?? product?.price ?? 0;
}

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, variantAttributes = null, selections = null) => {
        if (!product?._id) return;
        const stock = stockOf(product);
        if (stock <= 0) {
          toast.error('This item is out of stock');
          return;
        }

        const { items } = get();
        const selKey = selections ? JSON.stringify(selections) : '';
        const variantKey = variantAttributes ? JSON.stringify(variantAttributes) : '';
        const key = [product._id, selKey, variantKey].filter(Boolean).join('-');
        const existingIndex = items.findIndex((item) => item.key === key);
        const qty = Math.max(1, Number(quantity) || 1);

        if (existingIndex > -1) {
          const next = [...items];
          const nextQty = Math.min(stock, next[existingIndex].quantity + qty);
          if (nextQty === next[existingIndex].quantity) {
            toast.error(`Only ${stock} left in stock`);
            return;
          }
          next[existingIndex] = { ...next[existingIndex], quantity: nextQty };
          set({ items: next });
          toast.success('Cart updated');
          return;
        }

        set({
          items: [
            ...items,
            { key, product, quantity: Math.min(stock, qty), variantAttributes, selections },
          ],
        });
        toast.success('Added to cart');
      },

      removeItem: (key) => {
        set({ items: get().items.filter((item) => item.key !== key) });
        toast.success('Removed from cart');
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((item) => {
            if (item.key !== key) return item;
            const max = stockOf(item.product);
            if (max > 0 && quantity > max) {
              toast.error(`Only ${max} left in stock`);
              return { ...item, quantity: max };
            }
            return { ...item, quantity };
          }),
        });
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce((total, item) => total + priceOf(item.product) * item.quantity, 0),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getShipping: () => 0,

      getTotal: () => get().getSubtotal() + get().getShipping(),

      hasOutOfStock: () => get().items.some((item) => stockOf(item.product) <= 0),
    }),
    {
      name: 'luxury-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
