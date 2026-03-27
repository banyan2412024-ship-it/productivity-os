import { useState } from 'react'
import { useProfileStore } from '../stores/profileStore'
import { useAuthStore } from '../stores/authStore'
import { THEMES, THEME_META, DEFAULT_THEME } from '../themes'
import { getEffectiveTheme } from '../lib/applyTheme'

const ALL_MODULES = [
  { key: 'tasks',    label: 'Tasks' },
  { key: 'notes',    label: 'Notes' },
  { key: 'ideas',    label: 'Ideas' },
  { key: 'habits',   label: 'Habits' },
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'money',    label: 'Money' },
  { key: 'smoking',  label: 'Weed Log' },
]

const CUSTOM_VARS = [
  { key: '--bg-base',    label: 'Background' },
  { key: '--bg-surface', label: 'Surface' },
  { key: '--neon',       label: 'Accent (neon)' },
  { key: '--text',       label: 'Text' },
  { key: '--text-dim',   label: 'Text dim' },
  { key: '--cyan',       label: 'Cyan accent' },
  { key: '--amber',      label: 'Amber' },
  { key: '--danger',     label: 'Danger' },
]

const section = { marginBottom: '28px' }
const sectionTitle = { fontSize: '10px', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '4px' }
const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }

export default function SettingsPage() {
  const profile = useProfileStore((s) => s.profile)
  const setTheme = useProfileStore((s) => s.setTheme)
  const setCustomTheme = useProfileStore((s) => s.setCustomTheme)
  const setModules = useProfileStore((s) => s.setModules)
  const signOut = useAuthStore((s) => s.signOut)

  const [customMode, setCustomMode] = useState(false)
  const [customVars, setCustomVars] = useState(() => {
    if (profile?.custom_theme) return profile.custom_theme
    return getEffectiveTheme(profile?.theme ?? DEFAULT_THEME)
  })
  const [saved, setSaved] = useState(false)

  if (!profile) return null

  const enabledModules = profile.enabled_modules ?? ALL_MODULES.map((m) => m.key)

  const toggleModule = (key) => {
    const next = enabledModules.includes(key)
      ? enabledModules.filter((k) => k !== key)
      : [...enabledModules, key]
    setModules(next)
  }

  const handleCustomSave = async () => {
    await setCustomTheme(customVars)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleCustomVar = (key, val) => {
    const updated = { ...customVars, [key]: val }
    setCustomVars(updated)
    document.documentElement.style.setProperty(key, val)
  }

  return (
    <div style={{ padding: '28px', maxWidth: '560px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '13px', color: 'var(--neon)', marginBottom: '24px', letterSpacing: '3px' }}>
        &gt; SETTINGS
      </h1>

      {/* ─── Account ─────────────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionTitle}>Account</div>
        <div style={row}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Username</span>
          <span style={{ fontSize: '11px', color: 'var(--neon)' }}>{profile.username}</span>
        </div>
        <div style={row}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Status</span>
          <span style={{ fontSize: '11px', color: profile.status === 'approved' ? 'var(--neon)' : 'var(--amber)' }}>
            {profile.status.toUpperCase()}
          </span>
        </div>
        <div style={row}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Role</span>
          <span style={{ fontSize: '11px', color: profile.is_admin ? 'var(--cyan)' : 'var(--text-ghost)' }}>
            {profile.is_admin ? 'ADMIN' : 'USER'}
          </span>
        </div>
        <button
          onClick={signOut}
          style={{ marginTop: '10px', fontSize: '10px', color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)', padding: '4px 12px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
        >
          [ SIGN OUT ]
        </button>
      </div>

      {/* ─── Theme ───────────────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionTitle}>Theme</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {Object.entries(THEME_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => { setTheme(key); setCustomMode(false) }}
              style={{
                padding: '6px 14px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${profile.theme === key && !profile.custom_theme ? meta.preview : 'var(--border-mid)'}`,
                background: profile.theme === key && !profile.custom_theme ? 'var(--neon-ghost)' : 'transparent',
                color: profile.theme === key && !profile.custom_theme ? meta.preview : 'var(--text-ghost)',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: meta.preview, marginRight: '6px' }}>■</span>
              {meta.label}
            </button>
          ))}
          <button
            onClick={() => setCustomMode(!customMode)}
            style={{
              padding: '6px 14px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              border: `1px solid ${customMode ? 'var(--amber)' : 'var(--border-mid)'}`,
              background: customMode ? 'var(--neon-ghost)' : 'transparent',
              color: customMode ? 'var(--amber)' : 'var(--text-ghost)',
              cursor: 'pointer',
            }}
          >
            + CUSTOM
          </button>
        </div>

        {customMode && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', padding: '14px' }}>
            <p style={{ fontSize: '9px', color: 'var(--text-ghost)', margin: '0 0 12px' }}>
              &gt; Edit color values. Changes apply live.
            </p>
            {CUSTOM_VARS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <input
                  type="color"
                  value={customVars[key] ?? '#000000'}
                  onChange={(e) => handleCustomVar(key, e.target.value)}
                  style={{ width: '32px', height: '24px', border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', flex: 1 }}>{label}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>{customVars[key]}</span>
              </div>
            ))}
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-dark)', paddingTop: '10px' }}>
              <p style={{ fontSize: '9px', color: 'var(--text-ghost)', margin: '0 0 8px' }}>&gt; Matrix rain characters</p>
              <input
                value={customVars.matrixChars ?? ''}
                onChange={(e) => setCustomVars({ ...customVars, matrixChars: e.target.value })}
                placeholder="ア01ABCabc..."
                style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}
              />
              <p style={{ fontSize: '9px', color: 'var(--text-ghost)', margin: '0 0 4px' }}>&gt; Speed (ms per frame, lower = faster)</p>
              <input
                type="range" min="20" max="150"
                value={customVars.matrixSpeed ?? 50}
                onChange={(e) => setCustomVars({ ...customVars, matrixSpeed: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{customVars.matrixSpeed ?? 50}ms</span>
            </div>
            <button
              onClick={handleCustomSave}
              style={{ marginTop: '12px', width: '100%', fontSize: '10px', fontFamily: 'var(--font-mono)' }}
            >
              {saved ? '[ SAVED ✓ ]' : '[ SAVE CUSTOM THEME ]'}
            </button>
          </div>
        )}
      </div>

      {/* ─── Modules ─────────────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionTitle}>Modules</div>
        {ALL_MODULES.map(({ key, label }) => (
          <div key={key} style={row}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{label}</span>
            <button
              onClick={() => toggleModule(key)}
              style={{
                padding: '2px 10px',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${enabledModules.includes(key) ? 'var(--neon)' : 'var(--border-mid)'}`,
                background: enabledModules.includes(key) ? 'var(--neon-ghost)' : 'transparent',
                color: enabledModules.includes(key) ? 'var(--neon)' : 'var(--text-ghost)',
                cursor: 'pointer',
              }}
            >
              {enabledModules.includes(key) ? '[ ON ]' : '[ OFF ]'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
