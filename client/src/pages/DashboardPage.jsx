import { useEffect, useMemo, useState, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js'
import { endpoints } from '../lib/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const data = await endpoints.stats(period)
        if (mounted) setStats(data)
      } catch (e) {
        console.error(e)
        if (mounted) setError('Failed to load stats')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [period])

  const chartData = useMemo(() => {
    const labels = stats?.daily?.dates ?? []
    const completed = stats?.daily?.completed ?? []
    const total = stats?.daily?.total ?? []
    // rolling completion rate (3-day window) as percent 0..100
    const window = 3
    const rolling = labels.map((_, idx) => {
      let sumC = 0, sumT = 0
      for (let j = Math.max(0, idx - window + 1); j <= idx; j++) {
        sumC += completed[j] || 0
        sumT += total[j] || 0
      }
      return sumT ? (sumC / sumT) * 100 : null
    })
    return {
      labels,
      datasets: [
        {
          label: 'Completed Tasks',
          data: completed,
          tension: 0.4,
          fill: true,
          borderColor: 'rgba(127, 86, 217, 0.9)',
          backgroundColor: (ctx) => {
            const { chart } = ctx
            const { ctx: g } = chart
            const gradient = g.createLinearGradient(0, 0, 0, chart.height)
            gradient.addColorStop(0, 'rgba(127, 86, 217, 0.35)')
            gradient.addColorStop(1, 'rgba(127, 86, 217, 0.02)')
            return gradient
          },
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: '3-Day Rolling Completion %',
          data: rolling,
            tension: 0.4,
            spanGaps: true,
            borderColor: 'rgba(0,0,0,0.55)',
            pointRadius: 0,
            borderWidth: 1.5,
            yAxisID: 'y2'
        }
      ]
    }
  }, [stats])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { boxWidth: 14 } },
      tooltip: { intersect: false, mode: 'index', callbacks: {
        label: (ctx) => {
          if (ctx.dataset.label.includes('Rolling')) {
            return `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed?.(0)}%`
          }
          return `${ctx.dataset.label}: ${ctx.parsed.y}`
        }
      } }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(120,120,120,0.1)' }, beginAtZero: true, ticks: { stepSize: 1 } },
      y2: { position: 'right', grid: { display: false }, beginAtZero: true, suggestedMax: 100, ticks: { callback: v => v + '%' } }
    }
  }), [])

  // Derived refined metrics (client-side only)
  const qualityScore = useMemo(() => {
    if (!stats) return null
    const comp = stats.completionRate || 0
    const streakNorm = stats.periodDays ? (stats.prodStreak / stats.periodDays) : 0
    const score = (comp * 0.6) + (streakNorm * 0.4)
    return Math.round(score * 100) // 0..100
  }, [stats])

  const qualityLabel = useMemo(() => {
    if (qualityScore == null) return ''
    if (qualityScore >= 85) return 'Excellent'
    if (qualityScore >= 70) return 'Strong'
    if (qualityScore >= 50) return 'Steady'
    if (qualityScore >= 30) return 'Emerging'
    return 'Starting'
  }, [qualityScore])

  const focusDay = useMemo(() => {
    if (!stats?.daily) return null
    const arr = stats.daily.dates.map((d,i) => ({ date: d, completed: stats.daily.completed[i] }))
    if (!arr.length) return null
    const max = arr.reduce((a,b) => b.completed > a.completed ? b : a, arr[0])
    if (max.completed === 0) return null
    return max
  }, [stats])

  // Personal Insight Derived Metrics
  const streakComparisons = useMemo(() => {
    if (!stats) return null
    return {
      prod: { current: stats.prodStreak, longest: stats.allTime?.prodLongest, periodLongest: stats.periodLongest?.prod },
      diary: { current: stats.diaryStreak, longest: stats.allTime?.diaryLongest, periodLongest: stats.periodLongest?.diary }
    }
  }, [stats])

  const engagement = useMemo(() => {
    if (!stats) return null
    const days = stats.periodDays || 0
    const entries = stats.diary?.entries || 0
    return days ? Math.round((entries / days) * 100) : 0
  }, [stats])

  const focusConcentration = useMemo(() => {
    if (!stats?.tasks?.topLabels || !stats.tasks.total) return null
    const sumTop3 = stats.tasks.topLabels.slice(0,3).reduce((s,l)=> s + l.count, 0)
    return Math.round((sumTop3 / stats.tasks.total) * 100)
  }, [stats])

  const momentum = useMemo(() => {
    if (!stats?.daily?.completed?.length || !stats.daily.total?.length) return null
    const n = stats.daily.completed.length
    if (n < 4) return null // need at least two points per half
    const half = Math.floor(n/2)
    let c1=0,t1=0,c2=0,t2=0
    for (let i=0;i<half;i++){ c1+=stats.daily.completed[i]; t1+=stats.daily.total[i] }
    for (let i=half;i<n;i++){ c2+=stats.daily.completed[i]; t2+=stats.daily.total[i] }
    const r1 = t1? c1/t1 : 0
    const r2 = t2? c2/t2 : 0
    const delta = (r2 - r1) * 100
    return { delta: Math.round(delta), current: Math.round(r2*100) }
  }, [stats])

  const consistency = useMemo(() => {
    if (!stats?.daily?.completed?.length) return null
    const vals = stats.daily.completed
    const mean = vals.reduce((a,b)=>a+b,0)/(vals.length||1)
    if (mean === 0) return 0
    const variance = vals.reduce((s,v)=> s + Math.pow(v-mean,2),0)/vals.length
    const std = Math.sqrt(variance)
    const cv = std/mean // coefficient of variation
    const score = Math.max(0, Math.min(100, Math.round(100 - (cv*100))))
    return score
  }, [stats])

  const heatStrip = useMemo(() => {
    if (!stats?.daily?.dates) return []
    return stats.daily.dates.map((d,i)=>{
      const comp = stats.daily.completed[i] || 0
      const tot = stats.daily.total[i] || 0
      const ratio = tot? comp/tot : 0
      return { date: d, comp, tot, ratio }
    })
  }, [stats])

  // Tile system ---------------------------------------------------------
  const defaultTileOrder = [
    'prodStreak','diaryStreak','tasksCompleted','diaryEntries','qualityScore','chart',
    'priorityMix','topLabels','moodDistribution','focusDay','streaksTasks','streaksDiary',
    'engagement','consistency','momentum','focusConcentration','heat'
  ]
  const [tileOrder, setTileOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dashboardTileOrder')||'[]') } catch { return [] }
  })
  const [customizing, setCustomizing] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const periodBtnRef = useRef(null)
  const periodMenuRef = useRef(null)

  useEffect(() => {
    if (!periodOpen) return
    const handleClick = (e) => {
      if (!periodBtnRef.current || !periodMenuRef.current) return
      if (periodBtnRef.current.contains(e.target) || periodMenuRef.current.contains(e.target)) return
      setPeriodOpen(false)
    }
    const handleKey = (e) => { if (e.key === 'Escape') setPeriodOpen(false) }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('mousedown', handleClick); window.removeEventListener('keydown', handleKey) }
  }, [periodOpen])
  useEffect(()=>{
    if(!tileOrder.length){ setTileOrder(defaultTileOrder) }
  },[]) // eslint-disable-line
  const persistOrder = (next) => {
    setTileOrder(next)
    try { localStorage.setItem('dashboardTileOrder', JSON.stringify(next)) } catch {}
  }
  const moveTile = (id, dir) => {
    const idx = tileOrder.indexOf(id); if(idx<0) return
    const ni = idx + dir; if(ni<0 || ni>=tileOrder.length) return
    const copy = [...tileOrder]; const tmp = copy[idx]; copy[idx]=copy[ni]; copy[ni]=tmp; persistOrder(copy)
  }
  const removeMissing = (order) => order.filter(id => id !== 'focusDay' || focusDay)

  const handleDragStart = (e,id) => {
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', id) } catch {}
    setDraggingId(id)
  }
  const handleDragOver = (e,id) => {
    if (!customizing) return
    e.preventDefault()
    if (id !== dragOverId) setDragOverId(id)
  }
  const handleDrop = (e,id) => {
    if (!customizing) return
    e.preventDefault()
    const dragId = draggingId || (e.dataTransfer?.getData('text/plain'))
    if (!dragId || dragId === id) { setDraggingId(null); setDragOverId(null); return }
    const order = [...tileOrder]
    const from = order.indexOf(dragId)
    const to = order.indexOf(id)
    if (from === -1 || to === -1) { setDraggingId(null); setDragOverId(null); return }
    order.splice(from,1)
    order.splice(to,0,dragId)
    persistOrder(order)
    setDraggingId(null)
    setDragOverId(null)
  }
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null) }

  const Tile = ({ id, children, span }) => {
    const isDragTarget = customizing && dragOverId === id && draggingId !== id
    const isDragging = customizing && draggingId === id
    const draggable = customizing
    return (
      <div
        className={`card pad-md flex flex-col gap-1 ${id==='chart' ? 'pad-lg' : ''} ${span||''} ${isDragTarget ? 'ring-2 ring-[var(--color-accent)] ring-offset-0' : ''} ${isDragging ? 'opacity-60' : ''}`}
        data-tile={id}
        draggable={draggable}
        onDragStart={(e)=>handleDragStart(e,id)}
        onDragOver={(e)=>handleDragOver(e,id)}
        onDrop={(e)=>handleDrop(e,id)}
        onDragEnd={handleDragEnd}
      >
        {customizing && <div className="flex items-center justify-between mb-1 text-[11px] opacity-60 select-none">
          <span className="cursor-grab">☰ Drag</span>
          <div className="flex gap-1">
            <button className="ui-btn-xs" onClick={()=>moveTile(id,-1)} aria-label="Move up" type="button">↑</button>
            <button className="ui-btn-xs" onClick={()=>moveTile(id,1)} aria-label="Move down" type="button">↓</button>
          </div>
        </div>}
        {children}
      </div>
    )
  }

  const tiles = {
    prodStreak: (<Tile id="prodStreak"><div className="text-sm opacity-70">Productivity Streak</div><div className="text-2xl mt-1">{stats?.prodStreak ?? '—'}<span className="text-sm opacity-60 ml-1">days</span></div></Tile>),
    diaryStreak: (<Tile id="diaryStreak"><div className="text-sm opacity-70">Diary Streak</div><div className="text-2xl mt-1">{stats?.diaryStreak ?? '—'}<span className="text-sm opacity-60 ml-1">days</span></div></Tile>),
    tasksCompleted: (<Tile id="tasksCompleted"><div className="text-sm opacity-70">Tasks Completed</div><div className="text-2xl mt-1">{stats?.tasks?.completed ?? 0}</div><div className="text-xs opacity-60 mt-1">of {stats?.tasks?.total ?? 0} • {(stats?.completionRate*100||0).toFixed(0)}%</div></Tile>),
    diaryEntries: (<Tile id="diaryEntries"><div className="text-sm opacity-70">Diary Entries</div><div className="text-2xl mt-1">{stats?.diary?.entries ?? 0}</div><div className="text-xs opacity-60 mt-1">Avg {stats?.diary?.avgWordsPerEntry ?? 0} words</div></Tile>),
    qualityScore: (<Tile id="qualityScore"><div className="text-sm opacity-70">Quality Score</div><div className="flex items-end gap-2 mt-1"><div className="text-2xl">{qualityScore ?? '—'}</div>{qualityScore != null && <div className="text-xs px-2 py-0.5 border border-[var(--border-hairline)] rounded-md opacity-70">{qualityLabel}</div>}</div><div className="text-[11px] opacity-50 mt-1">Blend of completion & streak (60/40)</div></Tile>),
    chart: (<Tile id="chart" span="md:col-span-5" ><div className="text-sm opacity-70 mb-2">Daily Completion</div>{loading ? <div>Loading…</div> : error ? <div className="text-red-400 text-sm">{error}</div> : <><div style={{height:260}}><Line data={chartData} options={options} /></div><div className="text-[11px] opacity-60 mt-2">Dark line shows 3-day rolling completion percentage.</div></>}</Tile>),
    priorityMix: (<Tile id="priorityMix"><h2 className="text-sm opacity-70">Priority Mix</h2><div className="flex flex-col gap-2 text-xs mt-1">{['high','medium','low'].map(p => (<div key={p} className="flex items-center gap-3"><div className="w-14 capitalize opacity-70">{p}</div><div className="flex-1 h-2 bg-[rgba(127,127,127,0.15)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-accent)]" style={{ width: stats?.tasks?.total ? `${((stats?.tasks?.byPriority?.[p]||0)/stats.tasks.total)*100}%` : '0%' }} /></div><div className="w-8 text-right">{stats?.tasks?.byPriority?.[p]||0}</div></div>))}</div></Tile>),
    topLabels: (<Tile id="topLabels"><h2 className="text-sm opacity-70">Top Labels</h2><div className="flex flex-col gap-2 text-xs mt-1">{(stats?.tasks?.topLabels?.length ? stats.tasks.topLabels : []).map(l => (<div key={l.label} className="flex items-center gap-2"><div className="px-2 py-1 border border-[var(--border-hairline)] rounded-md text-[11px]">#{l.label}</div><div className="flex-1 h-2 bg-[rgba(127,127,127,0.15)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-accent)]" style={{ width: `${(l.count / (stats.tasks.total||1))*100}%` }} /></div><div className="w-6 text-right">{l.count}</div></div>))}{!stats?.tasks?.topLabels?.length && <div className="text-xs opacity-50">No labels</div>}</div></Tile>),
    moodDistribution: (<Tile id="moodDistribution"><h2 className="text-sm opacity-70">Mood Distribution</h2><div className="flex flex-col gap-2 text-xs mt-1">{stats?.diary?.moodDistribution && Object.keys(stats.diary.moodDistribution).length ? (Object.entries(stats.diary.moodDistribution).sort((a,b)=> b[1]-a[1]).map(([m,c]) => (<div key={m} className="flex items-center gap-3"><div className="capitalize w-16 opacity-70">{m}</div><div className="flex-1 h-2 bg-[rgba(127,127,127,0.15)] rounded-full overflow-hidden"><div className="h-full bg-[var(--color-accent)]" style={{ width: `${(c / (stats.diary.entries||1))*100}%` }} /></div><div className="w-6 text-right">{c}</div></div>))) : <div className="text-xs opacity-50">No moods logged</div>}</div></Tile>),
    focusDay: focusDay ? (<Tile id="focusDay"><h2 className="text-sm opacity-70">Focus Day</h2><div className="text-lg font-medium mt-1">{focusDay.date}</div><div className="text-xs opacity-70">Completed tasks: {focusDay.completed}</div><div className="text-[11px] opacity-50">Most productive day in selected period.</div></Tile>) : null,
    streaksTasks: (<Tile id="streaksTasks"><h2 className="text-sm opacity-70 mb-1">Streaks (Tasks)</h2><div className="text-xs opacity-70">Current <span className="font-medium">{streakComparisons?.prod.current ?? '—'}</span> / Longest <span className="font-medium">{streakComparisons?.prod.longest ?? '—'}</span></div><div className="text-[11px] opacity-50">Period longest: {streakComparisons?.prod.periodLongest ?? '—'}</div>{streakComparisons && <div className="h-2 bg-[rgba(127,127,127,0.15)] rounded mt-2 overflow-hidden"><div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: streakComparisons.prod.longest ? `${(streakComparisons.prod.current / streakComparisons.prod.longest)*100}%` : 0 }} /></div>}</Tile>),
    streaksDiary: (<Tile id="streaksDiary"><h2 className="text-sm opacity-70 mb-1">Streaks (Diary)</h2><div className="text-xs opacity-70">Current <span className="font-medium">{streakComparisons?.diary.current ?? '—'}</span> / Longest <span className="font-medium">{streakComparisons?.diary.longest ?? '—'}</span></div><div className="text-[11px] opacity-50">Period longest: {streakComparisons?.diary.periodLongest ?? '—'}</div>{streakComparisons && <div className="h-2 bg-[rgba(127,127,127,0.15)] rounded mt-2 overflow-hidden"><div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: streakComparisons.diary.longest ? `${(streakComparisons.diary.current / streakComparisons.diary.longest)*100}%` : 0 }} /></div>}</Tile>),
    engagement: (<Tile id="engagement"><h2 className="text-sm opacity-70 mb-1">Engagement</h2><div className="text-2xl">{engagement ?? '—'}<span className="text-sm ml-1 opacity-60">%</span></div><div className="text-[11px] opacity-50">Days with a diary entry.</div></Tile>),
    consistency: (<Tile id="consistency"><h2 className="text-sm opacity-70 mb-1">Consistency</h2><div className="text-2xl">{consistency ?? '—'}</div><div className="text-[11px] opacity-50">Higher = steadier completion.</div></Tile>),
    momentum: (<Tile id="momentum"><h2 className="text-sm opacity-70 mb-1">Momentum</h2>{momentum ? (<><div className="text-2xl flex items-end gap-1">{momentum.delta > 0 && '+'}{momentum.delta}<span className="text-sm opacity-60">pts</span></div><div className="text-[11px] opacity-50">Current half {momentum.current}%</div></>) : <div className="text-xs opacity-50 mt-2">Need more days</div>}</Tile>),
    focusConcentration: (<Tile id="focusConcentration"><h2 className="text-sm opacity-70 mb-1">Focus Concentration</h2><div className="text-2xl">{focusConcentration ?? '—'}<span className="text-sm ml-1 opacity-60">%</span></div><div className="text-[11px] opacity-50">Top 3 labels share.</div></Tile>),
    heat: (<Tile id="heat" span="md:col-span-5"><h2 className="text-sm opacity-70">Daily Completion Heat</h2><div className="flex gap-1 flex-wrap mt-2">{heatStrip.map(h => { const intensity = h.ratio; const bg = `rgba(127,86,217,${0.15 + 0.55*intensity})`; const border = intensity ? 'rgba(127,86,217,0.5)' : 'rgba(127,127,127,0.2)'; return (<div key={h.date} title={`${h.date}: ${h.comp}/${h.tot} (${Math.round(h.ratio*100)}%)`} className="w-6 h-6 rounded-sm" style={{ background: bg, border: '1px solid '+border }} aria-label={`On ${h.date} completed ${h.comp} of ${h.tot} tasks`} />) })}{!heatStrip.length && <div className="text-xs opacity-50">No data</div>}</div><div className="text-[11px] opacity-50 mt-2">Color depth = completion ratio.</div></Tile>)
  }
  const activeOrder = removeMissing(tileOrder).filter(id => tiles[id])

  return (
    <div className="page-container">
      <section className={`card pad-lg mb-3 dashboard-header ${periodOpen ? 'dashboard-header-open' : ''}`}> 
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl mb-1">Dashboard</h1>
            <p className="text-sm opacity-70">Your productivity & reflection metrics.</p>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <div className="ui-dropdown" style={{ minWidth: 160 }}>
              <button
                ref={periodBtnRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={periodOpen}
                className="ui-dropdown-trigger !py-2 !px-3"
                onClick={()=>setPeriodOpen(o=>!o)}
              >
                <span className="dropdown-icon" aria-hidden>🗓️</span>
                <span className="dropdown-label">{(() => {
                  switch(period){
                    case '7': return 'Last 7 days'
                    case '14': return 'Last 14 days'
                    case '30': return 'Last 30 days'
                    case '60': return 'Last 60 days'
                    case '90': return 'Last 90 days'
                    default: return 'Period'
                  }
                })()}</span>
                <span className="dropdown-caret" aria-hidden>▾</span>
              </button>
              {periodOpen && (
                <div ref={periodMenuRef} className="ui-dropdown-menu" role="listbox" aria-label="Select period">
                  {[
                    ['7','Last 7 days'],
                    ['14','Last 14 days'],
                    ['30','Last 30 days'],
                    ['60','Last 60 days'],
                    ['90','Last 90 days']
                  ].map(([val,label]) => (
                    <button key={val} role="option" aria-selected={period===val} className="ui-menu-item" onClick={() => { setPeriod(val); setPeriodOpen(false) }}>
                      <span className="menu-label">{label}</span>
                      {period===val && <span className="menu-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="ui-btn-sm" onClick={()=>setCustomizing(c=>!c)}>{customizing ? 'Done' : 'Customize Layout'}</button>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-5 gap-3 auto-rows-[minmax(110px,auto)]" aria-label="Dashboard tiles" role="list" style={{transition:'margin-top .3s ease', marginTop: periodOpen? '4px':'0'}}>
        {activeOrder.map(id => tiles[id])}
      </div>

      {customizing && (
        <div className="card pad-md mt-4">
          <h2 className="text-sm opacity-70 mb-2">Reorder Tiles</h2>
          <ul className="flex flex-col gap-1 text-xs" aria-label="Tile order list">
            {tileOrder.map(id => (
              <li key={id} className={`flex items-center gap-2 ${dragOverId===id ? 'bg-[rgba(127,86,217,0.15)]' : ''}`} draggable={customizing}
                  onDragStart={(e)=>handleDragStart(e,id)} onDragOver={(e)=>handleDragOver(e,id)} onDrop={(e)=>handleDrop(e,id)} onDragEnd={handleDragEnd}>
                <span className="cursor-grab">☰</span>
                <span className="flex-1 truncate">{id}</span>
                <button className="ui-btn-xs" onClick={()=>moveTile(id,-1)} type="button">↑</button>
                <button className="ui-btn-xs" onClick={()=>moveTile(id,1)} type="button">↓</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn-sm" onClick={()=>persistOrder(defaultTileOrder)}>Reset Default</button>
            <button className="ui-btn-sm" onClick={()=>persistOrder(activeOrder)}>Normalize</button>
          </div>
          <div className="text-[11px] opacity-50 mt-2">Order is saved locally in your browser.</div>
        </div>
      )}
    </div>
  )
}
