import { useState, useMemo } from 'react'
import {
  Leaf,
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { useWeedStore, WEED_AMOUNTS } from '../stores/smokingStore'
import { useToastStore } from '../stores/toastStore'
import { format, subDays, addMonths, subMonths, eachDayOfInterval } from 'date-fns'

const panel = {
  background: 'var(--bg-surface)',
  borderTop: '2px solid #1a6b1a',
  borderLeft: '2px solid #1a6b1a',
  borderRight: '2px solid #003300',
  borderBottom: '2px solid #003300',
  padding: '14px',
  fontFamily: 'var(--font-mono)',
  marginBottom: '12px',
}

const panelTitle = {
  fontSize: '9px',
  color: 'var(--text-ghost)',
  letterSpacing: '2px',
  marginBottom: '10px',
  borderBottom: '1px solid var(--border)',
  paddingBottom: '6px',
}

export default function SmokingPage() {
  const [viewMonth, setViewMonth] = useState(new Date())

  const smokingLogs = useWeedStore((s) => s.smokingLogs)
  const logWeed = useWeedStore((s) => s.logWeed)
  const deleteLog = useWeedStore((s) => s.deleteLog)
  const addToast = useToastStore((s) => s.addToast)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const todayGrams = useMemo(
    () => smokingLogs.filter((l) => l.date === todayStr).reduce((s, l) => s + (l.grams || 0), 0),
    [smokingLogs, todayStr]
  )

  const todayLogs = useMemo(
    () => smokingLogs.filter((l) => l.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)),
    [smokingLogs, todayStr]
  )

  const weekData = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayLogs = smokingLogs.filter((l) => l.date === dateStr)
      days.push({
        date: dateStr,
        day: format(d, 'EEE'),
        grams: dayLogs.reduce((s, l) => s + (l.grams || 0), 0),
        isToday: i === 0,
      })
    }
    return days
  }, [smokingLogs])

  const weekMax = Math.max(...weekData.map((d) => d.grams), 0.1)

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const monthData = useMemo(() => {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return eachDayOfInterval({ start, end }).map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayLogs = smokingLogs.filter((l) => l.date === dateStr)
      return {
        date: dateStr,
        dayNum: d.getDate(),
        dayOfWeek: d.getDay(),
        grams: dayLogs.reduce((s, l) => s + (l.grams || 0), 0),
      }
    })
  }, [smokingLogs, year, month])

  const monthMax = Math.max(...monthData.map((d) => d.grams), 0.1)

  const avg7 = useMemo(() => {
    const today = new Date()
    let total = 0
    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(today, i), 'yyyy-MM-dd')
      total += smokingLogs.filter((l) => l.date === dateStr).reduce((s, l) => s + (l.grams || 0), 0)
    }
    return Math.round((total / 7) * 100) / 100
  }, [smokingLogs])

  const avg30 = useMemo(() => {
    const today = new Date()
    let total = 0
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(today, i), 'yyyy-MM-dd')
      total += smokingLogs.filter((l) => l.date === dateStr).reduce((s, l) => s + (l.grams || 0), 0)
    }
    return Math.round((total / 30) * 100) / 100
  }, [smokingLogs])

  function getHeatColor(grams) {
    if (grams === 0) return '#001a00'
    const intensity = grams / monthMax
    if (intensity <= 0.25) return '#003300'
    if (intensity <= 0.5) return '#005500'
    if (intensity <= 0.75) return '#007700'
    return '#00aa00'
  }

  function getHeatTextColor(grams) {
    if (grams === 0) return 'var(--text-ghost)'
    return grams / monthMax > 0.5 ? 'var(--neon)' : 'var(--text-dim)'
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-mono)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Leaf size={18} style={{ color: 'var(--neon)' }} />
        <span style={{ fontSize: '14px', color: 'var(--neon)', letterSpacing: '2px' }}>WEED_TRACKER.exe</span>
        <span style={{ fontSize: '10px', color: 'var(--text-ghost)', marginLeft: '4px' }}>// consumption log</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
        <div>

          {/* Today Panel */}
          <div style={panel}>
            <div style={panelTitle}>// TODAY_LOG</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', color: 'var(--neon)', textShadow: '0 0 12px rgba(0,255,65,0.6)', lineHeight: 1 }}>
                  {todayGrams.toFixed(1)}g
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginTop: '4px' }}>consumed today</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '280px' }}>
                {WEED_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      const id = logWeed(amt)
                      addToast(`+${amt}g logged`, { type: 'success', undoFn: () => { deleteLog(id); addToast('Undone', { type: 'info' }) } })
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-base)',
                      borderTop: '2px solid #1a6b1a', borderLeft: '2px solid #1a6b1a',
                      borderRight: '2px solid #003300', borderBottom: '2px solid #003300',
                      color: 'var(--neon)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      minWidth: 'unset',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}
                  >
                    +{amt}g
                  </button>
                ))}
              </div>
            </div>

            {todayLogs.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '6px' }}>// ENTRIES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {todayLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 8px',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ color: 'var(--neon)', fontWeight: 'bold' }}>{log.grams}g</span>
                      <span style={{ color: 'var(--text-ghost)', fontSize: '10px' }}>{log.time}</span>
                      <button
                        onClick={() => {
                          const g = log.grams
                          deleteLog(log.id)
                          addToast(`${g}g removed`, { type: 'info', undoFn: () => { logWeed(g); addToast('Restored', { type: 'success' }) } })
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: '0 2px', cursor: 'pointer', minWidth: 'unset', lineHeight: 1 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Week Bar Chart */}
          <div style={panel}>
            <div style={panelTitle}>// 7D_CHART</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
              {weekData.map((d) => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: d.isToday ? 'var(--neon)' : 'var(--text-ghost)' }}>{d.grams > 0 ? `${d.grams.toFixed(1)}` : ''}</span>
                  <div
                    style={{
                      width: '100%',
                      background: d.isToday ? 'var(--neon)' : '#005500',
                      minHeight: '4px',
                      height: `${Math.max((d.grams / weekMax) * 70, 4)}px`,
                      boxShadow: d.isToday ? '0 0 6px rgba(0,255,65,0.5)' : 'none',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: d.isToday ? 'var(--neon)' : 'var(--text-ghost)', fontWeight: d.isToday ? 'bold' : 'normal' }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Heatmap */}
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', minWidth: 'unset' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text)', minWidth: '120px', textAlign: 'center' }}>
                  {format(viewMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', minWidth: 'unset' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-ghost)' }}>
                <span>low</span>
                {['#001a00', '#003300', '#005500', '#007700', '#00aa00'].map((c) => (
                  <div key={c} style={{ width: '10px', height: '10px', background: c, border: '1px solid #003300' }} />
                ))}
                <span>high</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-ghost)', padding: '2px 0' }}>{d}</div>
              ))}
              {Array.from({ length: (monthData[0]?.dayOfWeek + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthData.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.grams.toFixed(1)}g`}
                  style={{
                    aspectRatio: '1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px',
                    background: getHeatColor(d.grams),
                    color: getHeatTextColor(d.grams),
                    border: d.date === todayStr ? '1px solid var(--neon)' : '1px solid transparent',
                  }}
                >
                  {d.dayNum}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats column */}
        <div style={{ minWidth: '180px' }}>
          <div style={panel}>
            <div style={panelTitle}>// STATISTICS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'TODAY', value: `${todayGrams.toFixed(1)}g`, color: 'var(--neon)' },
                { label: '7-DAY AVG', value: `${avg7}g/d`, color: 'var(--text)' },
                { label: '30-DAY AVG', value: `${avg30}g/d`, color: 'var(--text)' },
                { label: 'TOTAL ENTRIES', value: smokingLogs.length, color: 'var(--text-dim)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '9px', color: 'var(--text-ghost)', letterSpacing: '1px', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '18px', color, fontWeight: 'bold' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={panel}>
            <div style={panelTitle}>// TREND</div>
            {avg7 <= avg30 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(0,255,65,0.05)', border: '1px solid var(--border)' }}>
                <TrendingDown size={18} style={{ color: 'var(--neon)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--neon)', fontWeight: 'bold' }}>DECREASING</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>7d: {avg7}g &lt; 30d: {avg30}g</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(255,136,68,0.05)', border: '1px solid var(--border)' }}>
                <TrendingUp size={18} style={{ color: 'var(--orange)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 'bold' }}>INCREASING</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>7d: {avg7}g &gt; 30d: {avg30}g</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
