import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/applyTheme'
import { DEFAULT_THEME } from '../themes'

/** Race any promise against a timeout (default 6s) */
function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ])
}

export const useProfileStore = create((set, get) => ({
  profile: null,
  profileLoading: true,

  loadProfile: async (userId) => {
    try {
      const { data, error } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      )
      if (error) console.warn('[profileStore] loadProfile error:', error.message)
      if (data) {
        set({ profile: data, profileLoading: false })
        applyTheme(data.theme, data.custom_theme)
      } else {
        set({ profile: null, profileLoading: false })
      }
      return data ?? null
    } catch (e) {
      console.warn('[profileStore] loadProfile threw:', e.message)
      set({ profile: null, profileLoading: false })
      return null
    }
  },

  createProfile: async (userId, username) => {
    const row = {
      id: userId,
      username,
      theme: DEFAULT_THEME,
      custom_theme: null,
      enabled_modules: ['tasks', 'notes', 'ideas', 'habits', 'pomodoro'],
      is_admin: false,
      status: 'pending',
    }
    try {
      const { error } = await withTimeout(
        supabase.from('profiles').insert(row)
      )
      if (error) {
        if (error.code === '23505') {
          if (error.message?.includes('username')) throw new Error('USERNAME ALREADY TAKEN')
          return get().loadProfile(userId)
        }
        throw new Error(error.message ?? 'INSERT FAILED')
      }
      const profile = { ...row, created_at: new Date().toISOString() }
      set({ profile, profileLoading: false })
      applyTheme(profile.theme)
      // Notify admin of new signup (fire-and-forget)
      const apiUrl = import.meta.env.VITE_API_URL ?? ''
      fetch(`${apiUrl}/notify-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).catch(() => {})
      return profile
    } catch (e) {
      console.warn('[profileStore] createProfile threw:', e.message)
      throw e
    }
  },

  setTheme: async (themeKey) => {
    const { profile } = get()
    if (!profile) return
    applyTheme(themeKey, profile.custom_theme)
    set({ profile: { ...profile, theme: themeKey } })
    await supabase.from('profiles').update({ theme: themeKey }).eq('id', profile.id)
  },

  setCustomTheme: async (customTheme) => {
    const { profile } = get()
    if (!profile) return
    applyTheme(profile.theme, customTheme)
    set({ profile: { ...profile, custom_theme: customTheme } })
    await supabase.from('profiles').update({ custom_theme: customTheme }).eq('id', profile.id)
  },

  setModules: async (modules) => {
    const { profile } = get()
    if (!profile) return
    set({ profile: { ...profile, enabled_modules: modules } })
    await supabase.from('profiles').update({ enabled_modules: modules }).eq('id', profile.id)
  },

  clearProfile: () => {
    set({ profile: null, profileLoading: false })
    applyTheme(DEFAULT_THEME)
  },

  // Admin only — uses security definer RPC to bypass RLS
  getAllProfiles: async () => {
    const { data } = await supabase.rpc('get_all_profiles')
    return data ?? []
  },

  adminUpdateProfile: async (userId, updates) => {
    const apiUrl = import.meta.env.VITE_API_URL ?? ''
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${apiUrl}/api/admin/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId, updates }),
    })
    return res.ok
  },

  adminResetUserData: async (userId) => {
    const apiUrl = import.meta.env.VITE_API_URL ?? ''
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${apiUrl}/api/admin/reset-user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId }),
    })
    return res.ok
  },
}))

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
    if (session?.user) {
      try {
        const profile = await useProfileStore.getState().loadProfile(session.user.id)
        if (!profile && event === 'SIGNED_IN') {
          const pending = sessionStorage.getItem('pending_username')
          if (pending) {
            sessionStorage.removeItem('pending_username')
            await useProfileStore.getState().createProfile(session.user.id, pending)
          }
        }
      } catch (e) {
        console.warn('[profileStore] onAuthStateChange error:', e.message)
        useProfileStore.setState({ profileLoading: false })
      }
    } else {
      useProfileStore.setState({ profileLoading: false })
    }
  } else if (event === 'SIGNED_OUT') {
    useProfileStore.getState().clearProfile()
  }
})
