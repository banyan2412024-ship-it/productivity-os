import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email, password) =>
    supabase.auth.signUp({ email, password }),

  signOut: () => supabase.auth.signOut(),
}))
