import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/applyTheme'

export const useProfileStore = create((set, get) => ({
  profile: null,
  profileLoading: true,

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

  // Admin only — uses security definer RPC to bypass RLS
  getAllProfiles: async () => {
    const { data } = await supabase.rpc('get_all_profiles')
    return data ?? []
  },

  adminUpdateProfile: async (userId, updates) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) console.warn('[adminUpdateProfile]', error.message)
    return !error
  },

  adminResetUserData: async (userId) => {
    const { error } = await supabase.rpc('admin_reset_user_data', { target_user_id: userId })
    if (error) console.warn('[adminResetUserData]', error.message)
    return !error
  },
}))
