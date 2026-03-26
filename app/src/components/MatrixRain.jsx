import { useEffect, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef'
const COL_W = 16
const SPEED = 50

export default function MatrixRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

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

        // Head character — bright neon
        ctx.fillStyle = '#00ff41'
        ctx.fillText(char, x, y)

        // Trail — dimmer
        if (drops[i] > 1) {
          const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)]
          ctx.fillStyle = '#00b300'
          ctx.fillText(trailChar, x, y - COL_W)
        }

        // Fading tail
        if (drops[i] > 3) {
          const tailChar = CHARS[Math.floor(Math.random() * CHARS.length)]
          ctx.fillStyle = '#003300'
          ctx.fillText(tailChar, x, y - COL_W * 3)
        }

        drops[i]++

        // Reset at random points after passing bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
      }
    }, SPEED)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.18,
        pointerEvents: 'none',
      }}
    />
  )
}
