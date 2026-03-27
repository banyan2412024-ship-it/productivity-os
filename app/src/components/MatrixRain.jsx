import { useEffect, useRef } from 'react'
import { useProfileStore } from '../stores/profileStore'
import { getEffectiveTheme } from '../lib/applyTheme'
import { DEFAULT_THEME } from '../themes'

const COL_W = 16

export default function MatrixRain() {
  const canvasRef = useRef(null)
  const profile = useProfileStore((s) => s.profile)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const theme = getEffectiveTheme(
      profile?.theme ?? DEFAULT_THEME,
      profile?.custom_theme ?? null
    )
    const CHARS = theme.matrixChars ?? 'アイウエオカキクケコABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const SPEED = theme.matrixSpeed ?? 50
    const C1 = theme.matrixColor1 ?? '#00ff41'
    const C2 = theme.matrixColor2 ?? '#00b300'
    const C3 = theme.matrixColor3 ?? '#003300'

    let cols, drops

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Math.floor(canvas.width / COL_W)
      drops = Array.from({ length: cols }, () => Math.random() * -50)
    }

    resize()
    window.addEventListener('resize', resize)

    const interval = setInterval(() => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `14px 'Share Tech Mono', monospace`

      for (let i = 0; i < cols; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * COL_W
        const y = drops[i] * COL_W

        ctx.fillStyle = C1
        ctx.fillText(char, x, y)

        if (drops[i] > 1) {
          ctx.fillStyle = C2
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - COL_W)
        }
        if (drops[i] > 3) {
          ctx.fillStyle = C3
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - COL_W * 3)
        }

        drops[i]++
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
      }
    }, SPEED)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [profile?.theme, profile?.custom_theme])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.18, pointerEvents: 'none' }}
    />
  )
}
