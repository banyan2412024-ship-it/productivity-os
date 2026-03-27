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

    // If already logged in, migrate after stores hydrate
    if (user) setTimeout(() => autoMigrateIfEmpty(user.id), 1500)

    supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      set({ user: u })
      // On fresh sign-in, migrate after stores hydrate
      if (event === 'SIGNED_IN' && u) setTimeout(() => autoMigrateIfEmpty(u.id), 1500)
    })
  },

  signOut: () => supabase.auth.signOut(),
}))
