import { useRef, useEffect } from 'react'

const CHARS = 'ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆｼｽ0123456789ABCDEF'
const FONT_SIZE = 14
const TRAIL_ALPHA = 0.05
const FALL_SPEED = 0.6
const RESET_THRESHOLD = 0.975

export default function MatrixLoader({ progress, showHud, granted, children }) {
  const canvasRef = useRef(null)
  const dropsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const cols = Math.floor(canvas.width / FONT_SIZE)
      dropsRef.current = Array.from({ length: cols }, () => Math.random() * -20)
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const drops = dropsRef.current
      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * FONT_SIZE
        const y = drops[i] * FONT_SIZE

        if (Math.random() > 0.92) {
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${FONT_SIZE}px monospace`
        } else {
          ctx.fillStyle = '#00ff41'
          ctx.font = `${FONT_SIZE}px monospace`
        }

        ctx.fillText(char, x, y)

        if (drops[i] > 1) {
          const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)]
          ctx.fillStyle = 'rgba(0, 255, 65, 0.3)'
          ctx.font = `${FONT_SIZE}px monospace`
          ctx.fillText(trailChar, x, y - FONT_SIZE)
        }

        drops[i] += FALL_SPEED
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > RESET_THRESHOLD) {
          drops[i] = 0
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Overlay content (forms, progress, ACCESS GRANTED) */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflowY: 'auto', padding: '16px 0',
      }}>
        {/* ACCESS GRANTED flash */}
        {granted && (
          <div style={{
            fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold',
            color: '#fff', letterSpacing: '6px',
            textShadow: '0 0 20px rgba(0,255,65,0.9), 0 0 40px rgba(0,255,65,0.5)',
            animation: 'grantedFlash 1.2s ease-out forwards',
          }}>
            ACCESS GRANTED
          </div>
        )}

        {/* Loading HUD */}
        {showHud && !granted && (
          <div style={{ position: 'absolute', bottom: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '280px', height: '2px',
              background: 'rgba(0,255,65,0.15)', borderRadius: '1px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress ?? 0}%`,
                background: '#00ff41', boxShadow: '0 0 8px rgba(0,255,65,0.8)',
                transition: 'width 0.3s ease-out',
              }} />
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: '10px',
              color: '#00ff41', letterSpacing: '2px',
              textShadow: '0 0 6px rgba(0,255,65,0.6)',
            }}>
              LOADING SYSTEM... {Math.floor(progress ?? 0)}%
            </div>
          </div>
        )}

        {/* Floating content (login forms etc) */}
        {children}
      </div>

      <style>{`
        @keyframes grantedFlash {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; color: #fff; transform: scale(1.05); }
          40% { color: #00ff41; transform: scale(1); }
          100% { opacity: 1; color: #00ff41; }
        }
      `}</style>
    </div>
  )
}
