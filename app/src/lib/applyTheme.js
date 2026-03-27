import { THEMES, DEFAULT_THEME } from '../themes'

export function applyTheme(themeKey, customTheme = null) {
  const base = THEMES[themeKey] ?? THEMES[DEFAULT_THEME]
  const merged = customTheme ? { ...base, ...customTheme } : base
  for (const [key, val] of Object.entries(merged)) {
    if (key.startsWith('--')) {
      document.documentElement.style.setProperty(key, val)
    }
  }
}

export function getEffectiveTheme(themeKey, customTheme = null) {
  const base = THEMES[themeKey] ?? THEMES[DEFAULT_THEME]
  return customTheme ? { ...base, ...customTheme } : base
}
