import { useEffect, useState, useMemo, useRef } from 'react'
import { useDate } from '../contexts/DateContext.jsx'
import WeekBar from '../components/WeekBar.jsx'
import Calendar from '../components/Calendar.jsx'
import TaskList from '../components/tasks/TaskList.jsx'
import { endpoints } from '../lib/api.js'
import AddTaskPill from '../components/tasks/AddTaskPill.jsx'

export default function ToDoPage() {
  const { date } = useDate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { tasks } = await endpoints.tasks.list(date)
      setTasks(tasks)
    } catch (e) {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [date])

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key || ''
      const isN = k === 'n' || k === 'N'
      const isTypingTarget = (() => {
        const t = e.target
        if (!t) return false
        const tag = (t.tagName || '').toUpperCase()
        const editable = t.isContentEditable
        return editable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      })()
      // Plain N when not typing
      if (!isTypingTarget && !e.ctrlKey && !e.metaKey && !e.altKey && isN) {
        e.preventDefault(); e.stopPropagation();
        setAddOpen(true)
      }
    }
    // Capture phase ensures we get the event before other handlers
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const progress = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.done).length
    return { total, done, pct: total ? Math.round((done/total)*100) : 0 }
  }, [tasks])

  const api = {
    async reorder(body){ await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/tasks/reorder`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }) },
  }

  

  const toggleDone = async (id, done) => {
    const { task } = await endpoints.tasks.update(id, { done })
    setTasks(prev=> prev.map(t=> t._id===id? task : t))
  }

  const remove = async (id) => {
    await endpoints.tasks.remove(id)
    setTasks(prev=> prev.filter(t=> t._id!==id))
  }

  return (
    <section className="page-container">
      <h1 className="text-4xl mb-6">To‑Do List</h1>
      <div className="card pad-lg">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Calendar />
          <WeekBar />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm opacity-70">{progress.done}/{progress.total} complete</div>
          <div style={{ width: 160, height: 8, borderRadius: 9999, background: 'rgba(127, 127, 127, 0.15)' }}>
            <div style={{ width: `${progress.pct}%`, height: '100%', borderRadius: 9999, background: 'var(--color-accent)' }} />
          </div>
        </div>
        <div className="mb-4">
          <AddTaskPill
            date={date}
            open={addOpen}
            onOpenChange={setAddOpen}
            onAdded={(task) => setTasks(prev => [...prev, task])}
          />
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {loading ? (
          <div className="space-y-2">
            <div className="h-10 rounded-xl" style={{ background: 'rgba(127,127,127,0.15)' }} />
            <div className="h-10 rounded-xl" style={{ background: 'rgba(127,127,127,0.15)' }} />
            <div className="h-10 rounded-xl" style={{ background: 'rgba(127,127,127,0.15)' }} />
          </div>
        ) : (
          <>
            <TaskList date={date} tasks={tasks} setTasks={setTasks} api={{
              update: (id, body) => endpoints.tasks.update(id, body).then(r=>r.task),
              remove: (id) => endpoints.tasks.remove(id),
              reorder: (body) => api.reorder(body)
            }} />
            {tasks.length===0 && <div className="opacity-70 py-2">No tasks yet.</div>}
          </>
        )}
      </div>
    </section>
  )
}
