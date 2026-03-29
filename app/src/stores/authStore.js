import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/applyTheme'
import { DEFAULT_THEME } from '../themes'

import { useProfileStore } from './profileStore'

function syncProfile(profile) {
  useProfileStore.setState({ profile, profileLoading: false })
}
function clearSyncedProfile() {
  useProfileStore.setState({ profile: null, profileLoading: false })
}

export const AUTH_STATE = {
  BOOTING:          'booting',
  LOADING:          'loading',
  READY:            'ready',
  PENDING_APPROVAL: 'pending_approval',
  REJECTED:         'rejected',
  UNAUTHENTICATED:  'unauthenticated',
  ERROR:            'error',
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function loadProfileWithBackoff(userId) {
  const delays = [200, 400, 800, 1600]
  for (let i = 0; i <= delays.length; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle()
      if (error) throw error
      if (data) return data
    } catch (e) {
      if (i === delays.length) throw e
    }
    if (i < delays.length) await sleep(delays[i])
  }
  return null
}

export const useAuthStore = create((set, get) => ({
  authState: AUTH_STATE.BOOTING,
  user: null,
  profile: null,
  error: null,

  init: () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return

      // Already in a stable auth state for the same user — don't re-enter LOADING
      // (happens when switching tabs triggers a SIGNED_IN event)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const { authState, user: currentUser } = get()
        const STABLE = [AUTH_STATE.READY, AUTH_STATE.PENDING_APPROVAL, AUTH_STATE.REJECTED]
        if (STABLE.includes(authState) && currentUser?.id === session?.user?.id) return
      }

      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('auth_granted')
        applyTheme(DEFAULT_THEME)
        clearSyncedProfile()
        set({ authState: AUTH_STATE.UNAUTHENTICATED, user: null, profile: null, error: null })
        return
      }

      const user = session?.user ?? null

      if (!user) {
        set({ authState: AUTH_STATE.UNAUTHENTICATED, user: null, profile: null, error: null })
        return
      }

      set({ authState: AUTH_STATE.LOADING, user, error: null })

      try {
        let profile = await loadProfileWithBackoff(user.id)

        // New signup — create profile from pending username stored before signup
        if (!profile && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          const pending = sessionStorage.getItem('pending_username')
          if (pending) {
            sessionStorage.removeItem('pending_username')
            const { data } = await supabase.from('profiles').insert({
              id: user.id,
              username: pending,
              enabled_modules: ['tasks', 'notes', 'ideas', 'habits', 'pomodoro'],
              is_admin: false,
              status: 'pending',
            }).select().single()
            profile = data
          }
        }

        if (!profile) {
          set({ authState: AUTH_STATE.ERROR, error: 'Profile unavailable — please refresh' })
          return
        }

        applyTheme(profile.theme, profile.custom_theme)
        syncProfile(profile)

        if (profile.status === 'approved') {
          set({ authState: AUTH_STATE.READY, profile, error: null })
        } else if (profile.status === 'rejected') {
          set({ authState: AUTH_STATE.REJECTED, profile, error: null })
        } else {
          set({ authState: AUTH_STATE.PENDING_APPROVAL, profile, error: null })
        }
      } catch (e) {
        console.warn('[authStore] profile load failed:', e.message)
        set({ authState: AUTH_STATE.ERROR, error: 'Could not load profile — please retry' })
      }
    })
  },

  retryAuth: async () => {
    const { user } = get()
    if (!user) { set({ authState: AUTH_STATE.UNAUTHENTICATED }); return }
    set({ authState: AUTH_STATE.LOADING, error: null })
    try {
      const profile = await loadProfileWithBackoff(user.id)
      if (!profile) throw new Error('Profile still unavailable')
      applyTheme(profile.theme, profile.custom_theme)
      syncProfile(profile)
      if (profile.status === 'approved') set({ authState: AUTH_STATE.READY, profile })
      else if (profile.status === 'rejected') set({ authState: AUTH_STATE.REJECTED, profile })
      else set({ authState: AUTH_STATE.PENDING_APPROVAL, profile })
    } catch (e) {
      set({ authState: AUTH_STATE.ERROR, error: e.message })
    }
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return { user: data.user, needsEmailConfirm: !data.session }
  },

  signOut: () => supabase.auth.signOut(),
}))
