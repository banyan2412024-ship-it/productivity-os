import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: () => {
    const fallback = setTimeout(() => set({ loading: false }), 3000)
    supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(fallback)
      // Only update user on meaningful events — TOKEN_REFRESHED can briefly null the session
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const u = session?.user ?? null
        set({ user: u, loading: false })
      }
    })
  },

  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // Profile creation (status: 'pending') happens in AuthGate after signup
    return { user: data.user, needsEmailConfirm: !data.session }
  },

  // Convert existing anonymous session to email+password account
  linkEmail: async (email, password) => {
    const { error } = await supabase.auth.updateUser({ email, password })
    if (error) throw error
  },

  signOut: () => supabase.auth.signOut(),
}))
