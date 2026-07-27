import { create } from 'zustand';

let counter = 0;

const useToastStore = create((set, get) => ({
  toasts: [],

  push: (type, message, duration = 2600) => {
    if (!message) return;
    const id = ++counter;
    set({ toasts: [...get().toasts, { id, type, message }].slice(-3) });
    setTimeout(() => get().dismiss(id), duration);
    return id;
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message) => useToastStore.getState().push('success', message),
  error: (message) => useToastStore.getState().push('error', message),
  info: (message) => useToastStore.getState().push('info', message),
};

export default useToastStore;
