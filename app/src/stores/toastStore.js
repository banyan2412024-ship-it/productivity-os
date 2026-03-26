import { create } from 'zustand'
import { v4 as uuid } from 'uuid'

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, { type = 'info', undoFn = null, duration = 3500 } = {}) => {
    const id = uuid()
    const toast = { id, message, type, undoFn, createdAt: Date.now() }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
    return id
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
