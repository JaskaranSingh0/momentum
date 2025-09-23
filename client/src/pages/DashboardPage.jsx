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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await endpoints.stats('7d')
        if (mounted) setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  const chartData = useMemo(() => {
    const labels = stats?.last7Days?.map(d => d.date) ?? []
    const completed = stats?.last7Days?.map(d => d.completed) ?? []
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
        <h1 className="text-xl mb-1">Dashboard</h1>
        <p className="text-sm opacity-70">Your weekly progress and streaks.</p>
      </section>

      <section className="grid md:grid-cols-3 gap-3 mt-3">
        <div className="card pad-md">
          <div className="text-sm opacity-70">Current Streak</div>
          <div className="text-2xl mt-1">{stats?.currentStreak ?? '—'} days</div>
        </div>
        <div className="card pad-md">
          <div className="text-sm opacity-70">Tasks Completed</div>
          <div className="text-2xl mt-1">{stats?.completedTasks ?? 0}</div>
        </div>
        <div className="card pad-md">
          <div className="text-sm opacity-70">Diary Entries</div>
          <div className="text-2xl mt-1">{stats?.diaryEntries ?? 0}</div>
        </div>
      </section>

      <section className="card pad-lg mt-3" style={{ height: 300 }}>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </section>
    </div>
  )
}
