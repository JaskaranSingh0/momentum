import { useEffect, useState } from 'react'
import { endpoints } from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function DashboardPage() {
  const [period, setPeriod] = useState('7')
  const [stats, setStats] = useState(null)
  const { user, setUser } = useAuth()

  useEffect(() => {
    endpoints.stats(period).then(setStats).catch(()=>setStats(null))
  }, [period])

  const toggleTheme = async () => {
    const newTheme = user?.theme === 'dark' ? 'light' : 'dark'
    await endpoints.theme(newTheme)
    setUser({ ...user, theme: newTheme })
  }

  const exportData = async () => {
    const res = await endpoints.meExport()
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'momentum-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteAccount = async () => {
    const confirm = window.prompt('Type DELETE to permanently delete your account and all data:')
    if (confirm === 'DELETE') {
      await endpoints.meDelete()
      window.location.reload()
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm">Period:
            <select value={period} onChange={e=>setPeriod(e.target.value)} className="ml-2 border rounded px-2 py-1 bg-transparent">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
        </div>
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded">
              <div className="text-sm opacity-70">Task Completion Rate</div>
              <div className="text-3xl font-bold">{Math.round(stats.completionRate*100)}%</div>
            </div>
            <div className="p-4 border rounded">
              <div className="text-sm opacity-70">Productivity Streak</div>
              <div className="text-3xl font-bold">{stats.prodStreak} days</div>
            </div>
            <div className="p-4 border rounded">
              <div className="text-sm opacity-70">Diary Streak</div>
              <div className="text-3xl font-bold">{stats.diaryStreak} days</div>
            </div>
            <div className="md:col-span-3 p-4 border rounded">
              <div className="text-sm opacity-70 mb-3">Weekly Task Chart (Completed)</div>
              <Bar
                data={{
                  labels: stats.weekly.dates.map(d=> new Date(d).toLocaleDateString(undefined,{weekday:'short'})),
                  datasets: [{
                    label: 'Completed',
                    data: stats.weekly.completed,
                    backgroundColor: '#111827',
                  }]
                }}
                options={{ responsive: true, animation: { duration: 600 } }}
              />
            </div>
          </div>
        ) : <p>Loading stats…</p>}
      </div>

      <div className="p-4 border rounded space-y-3">
        <h2 className="text-xl font-semibold">Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70">Theme</div>
            <div className="font-medium">{user?.theme || 'light'}</div>
          </div>
          <button className="px-3 py-2 border rounded" onClick={toggleTheme}>Toggle Theme</button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70">Account</div>
            <div className="font-medium">{user?.email}</div>
          </div>
          <div className="space-x-2">
            <button className="px-3 py-2 border rounded" onClick={exportData}>Export My Data</button>
            <button className="px-3 py-2 border rounded text-red-600" onClick={deleteAccount}>Delete My Account</button>
          </div>
        </div>
      </div>
    </section>
  )
}
