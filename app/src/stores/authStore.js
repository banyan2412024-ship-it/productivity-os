import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { autoMigrateIfEmpty } from './autoMigrate'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    set({ user, loading: false })

    if (user) setTimeout(() => autoMigrateIfEmpty(user.id), 1500)

    supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      set({ user: u })
      if (event === 'SIGNED_IN' && u) setTimeout(() => autoMigrateIfEmpty(u.id), 1500)
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
