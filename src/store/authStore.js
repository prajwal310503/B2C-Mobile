import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, onUnauthorized, TOKEN_KEY } from '../services/api';
import { toast } from './toastStore';
import useWishlistStore from './wishlistStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      authReady: false,

      bootstrap: async () => {
        const token = get().token || (await AsyncStorage.getItem(TOKEN_KEY));
        if (!token) {
          set({ user: null, token: null, authReady: true });
          return;
        }
        await AsyncStorage.setItem(TOKEN_KEY, token);
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.data.user || data.data, token, authReady: true });
          useWishlistStore.getState().syncFromServer().catch(() => {});
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null, authReady: true });
        }
      },

      login: async (credentials) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.login(credentials);
          await AsyncStorage.setItem(TOKEN_KEY, data.token);
          set({ user: data.data, token: data.token, loading: false, authReady: true });
          toast.success('Welcome back!');
          useWishlistStore.getState().syncFromServer().catch(() => {});
          return data.data;
        } catch (error) {
          set({ loading: false });
          toast.error(error?.message || 'Login failed');
          throw error;
        }
      },

      googleLogin: async (credential, referralCode) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.googleAuth({
            credential,
            referralCode: referralCode || undefined,
          });
          await AsyncStorage.setItem(TOKEN_KEY, data.token);
          set({ user: data.data, token: data.token, loading: false, authReady: true });
          toast.success('Welcome!');
          useWishlistStore.getState().syncFromServer().catch(() => {});
          return data.data;
        } catch (error) {
          set({ loading: false });
          toast.error(error?.message || 'Google sign-in failed');
          throw error;
        }
      },

      register: async (payload) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.register(payload);
          await AsyncStorage.setItem(TOKEN_KEY, data.token);
          set({ user: data.data, token: data.token, loading: false, authReady: true });
          toast.success('Account created successfully!');
          useWishlistStore.getState().syncFromServer().catch(() => {});
          return data.data;
        } catch (error) {
          set({ loading: false });
          toast.error(error?.message || 'Registration failed');
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {
          // Session is cleared locally regardless of the server's reply.
        }
        await AsyncStorage.removeItem(TOKEN_KEY);
        useWishlistStore.getState().clear();
        set({ user: null, token: null, authReady: true });
        toast.success('Logged out');
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.data.user || data.data });
        } catch {
          // Interceptor already handles an expired session.
        }
      },

      updateUser: (user) => set({ user }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'luxury-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

onUnauthorized(() => {
  useAuthStore.setState({ user: null, token: null, authReady: true });
});

export default useAuthStore;
