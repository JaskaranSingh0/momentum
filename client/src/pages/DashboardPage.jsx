import { useEffect, useMemo, useState } from 'react'
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
          borderWidth: 2
        }
      ]
    }
  }, [stats])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: 'index' }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(120,120,120,0.1)' }, beginAtZero: true, ticks: { stepSize: 1 } }
    }
  }), [])

  return (
    <div className="page-container">
      <section className="card pad-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl mb-1">Dashboard</h1>
            <p className="text-sm opacity-70">Your productivity & reflection metrics.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="period" className="opacity-70">Period:</label>
            <select id="period" className="ui-select !w-32" value={period} onChange={e=>setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mt-3">
        <div className="card pad-md">
          <div className="text-sm opacity-70">Productivity Streak</div>
          <div className="text-2xl mt-1">{stats?.prodStreak ?? '—'}<span className="text-sm opacity-60 ml-1">days</span></div>
        </div>
        <div className="card pad-md">
          <div className="text-sm opacity-70">Diary Streak</div>
          <div className="text-2xl mt-1">{stats?.diaryStreak ?? '—'}<span className="text-sm opacity-60 ml-1">days</span></div>
        </div>
        <div className="card pad-md">
          <div className="text-sm opacity-70">Tasks Completed</div>
          <div className="text-2xl mt-1">{stats?.tasks?.completed ?? 0}</div>
          <div className="text-xs opacity-60 mt-1">of {stats?.tasks?.total ?? 0} • {(stats?.completionRate*100||0).toFixed(0)}%</div>
        </div>
        <div className="card pad-md">
          <div className="text-sm opacity-70">Diary Entries</div>
          <div className="text-2xl mt-1">{stats?.diary?.entries ?? 0}</div>
          <div className="text-xs opacity-60 mt-1">Avg {stats?.diary?.avgWordsPerEntry ?? 0} words</div>
        </div>
      </section>

      <section className="card pad-lg mt-3" style={{ height: 300 }}>
        {loading ? <div>Loading…</div> : error ? <div className="text-red-400 text-sm">{error}</div> : <Line data={chartData} options={options} />}
      </section>

      <section className="grid md:grid-cols-3 gap-3 mt-3">
        <div className="card pad-md flex flex-col gap-3">
          <h2 className="text-sm opacity-70">Priority Mix</h2>
          <div className="flex flex-col gap-2 text-xs">
            {['high','medium','low'].map(p => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-14 capitalize opacity-70">{p}</div>
                <div className="flex-1 h-2 bg-[rgba(127,127,127,0.15)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)]" style={{ width: stats?.tasks?.total ? `${((stats?.tasks?.byPriority?.[p]||0)/stats.tasks.total)*100}%` : '0%' }} />
                </div>
                <div className="w-8 text-right">{stats?.tasks?.byPriority?.[p]||0}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card pad-md flex flex-col gap-3">
          <h2 className="text-sm opacity-70">Top Labels</h2>
          <div className="flex flex-col gap-2 text-xs">
            {(stats?.tasks?.topLabels?.length ? stats.tasks.topLabels : []).map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="px-2 py-1 border border-[var(--border-hairline)] rounded-md text-[11px]">#{l.label}</div>
                <div className="flex-1 h-2 bg-[rgba(127,127,127,0.15)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)]" style={{ width: `${(l.count / (stats.tasks.total||1))*100}%` }} />
                </div>
                <div className="w-6 text-right">{l.count}</div>
              </div>
            ))}
            {!stats?.tasks?.topLabels?.length && <div className="text-xs opacity-50">No labels</div>}
          </div>
        </div>
        <div className="card pad-md flex flex-col gap-3">
          <h2 className="text-sm opacity-70">Mood Distribution</h2>
          <div className="flex flex-col gap-2 text-xs">
            {stats?.diary?.moodDistribution && Object.keys(stats.diary.moodDistribution).length ? (
              Object.entries(stats.diary.moodDistribution).sort((a,b)=> b[1]-a[1]).map(([m,c]) => (
                <div key={m} className="flex items-center gap-3">
                  <div className="capitalize w-16 opacity-70">{m}</div>
                  <div className="flex-1 h-2 bg-[rgba(127,127,127,0.15)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-accent)]" style={{ width: `${(c / (stats.diary.entries||1))*100}%` }} />
                  </div>
                  <div className="w-6 text-right">{c}</div>
                </div>
              ))
            ) : <div className="text-xs opacity-50">No moods logged</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
