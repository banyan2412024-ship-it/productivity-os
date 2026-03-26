import { useState, useMemo } from 'react'
import {
  Leaf,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { useWeedStore, WEED_AMOUNTS } from '../stores/smokingStore'
import { useToastStore } from '../stores/toastStore'
import { format, subDays, addMonths, subMonths, eachDayOfInterval } from 'date-fns'

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
    if (grams === 0) return 'bg-gray-100'
    const intensity = grams / monthMax
    if (intensity <= 0.25) return 'bg-green-200'
    if (intensity <= 0.5) return 'bg-green-300'
    if (intensity <= 0.75) return 'bg-green-400'
    return 'bg-green-500'
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Leaf size={24} className="text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">Weed Tracker</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          {/* Today */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Today</h2>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-500 mb-1">{todayGrams.toFixed(1)}g</div>
                <p className="text-sm text-gray-500">consumed today</p>
              </div>
              <div className="flex flex-wrap gap-2 max-w-[250px]">
                {WEED_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      const id = logWeed(amt)
                      addToast(`+${amt}g logged`, { type: 'success', undoFn: () => { deleteLog(id); addToast('Undone', { type: 'info' }) } })
                    }}
                    className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow hover:shadow-md transition-all"
                  >
                    +{amt}g
                  </button>
                ))}
              </div>
            </div>

            {todayLogs.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Log</p>
                <div className="flex flex-wrap gap-2">
                  {todayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-sm group"
                    >
                      <span className="text-green-700 font-medium">{log.grams}g</span>
                      <span className="text-green-500 text-xs">{log.time}</span>
                      <button
                        onClick={() => {
                          const g = log.grams
                          deleteLog(log.id)
                          addToast(`${g}g entry removed`, { type: 'info', undoFn: () => { logWeed(g); addToast('Restored', { type: 'success' }) } })
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Week chart */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Last 7 Days</h2>
            <div className="flex items-end gap-3 h-40">
              {weekData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-600">{d.grams.toFixed(1)}g</span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${d.isToday ? 'bg-green-500' : 'bg-green-300'}`}
                    style={{ height: `${Math.max((d.grams / weekMax) * 100, 4)}%` }}
                  />
                  <span className={`text-xs ${d.isToday ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly heatmap */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-base font-semibold text-gray-900 min-w-[130px] text-center">
                  {format(viewMonth, 'MMMM yyyy')}
                </h2>
                <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>Less</span>
                <div className="w-3 h-3 rounded bg-gray-100" />
                <div className="w-3 h-3 rounded bg-green-200" />
                <div className="w-3 h-3 rounded bg-green-300" />
                <div className="w-3 h-3 rounded bg-green-400" />
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>More</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-400 py-1">{d}</div>
              ))}
              {Array.from({ length: (monthData[0]?.dayOfWeek + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthData.map((d) => (
                <div
                  key={d.date}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs ${getHeatColor(d.grams)} ${
                    d.grams > 0 ? 'text-white font-medium' : 'text-gray-400'
                  }`}
                  title={`${d.date}: ${d.grams.toFixed(1)}g`}
                >
                  {d.dayNum}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Today</p>
                <p className="text-2xl font-bold text-green-500">{todayGrams.toFixed(1)}g</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">7-Day Avg</p>
                <p className="text-2xl font-bold text-gray-900">{avg7}g/day</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">30-Day Avg</p>
                <p className="text-2xl font-bold text-gray-900">{avg30}g/day</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{smokingLogs.length}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Trend</h2>
            {avg7 <= avg30 ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <TrendingDown size={20} className="text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-700">Going down</p>
                  <p className="text-xs text-green-600">
                    7d ({avg7}g) {avg7 < avg30 ? '<' : '='} 30d ({avg30}g)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <TrendingDown size={20} className="text-amber-500 rotate-180" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Going up</p>
                  <p className="text-xs text-amber-600">
                    7d ({avg7}g) &gt; 30d ({avg30}g)
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
