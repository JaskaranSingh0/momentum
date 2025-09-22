import { useEffect, useState } from 'react'
import { useDate } from '../contexts/DateContext.jsx'
import WeekBar from '../components/WeekBar.jsx'
import Calendar from '../components/Calendar.jsx'
import { endpoints } from '../lib/api.js'

export default function ToDoPage() {
  const { date } = useDate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

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

  const addTask = async () => {
    if (!text.trim()) return
    const { task } = await endpoints.tasks.create(date, text.trim())
    setTasks(prev=>[...prev, task])
    setText('')
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
    <section>
      <h1 className="text-2xl font-semibold mb-4">To-Do List</h1>
      <Calendar />
      <WeekBar />
      <div className="flex gap-2 mb-4">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="New task…" className="flex-1 border rounded px-3 py-2 bg-transparent" />
        <button onClick={addTask} className="px-3 py-2 border rounded">Add Task</button>
      </div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {loading ? <p>Loading…</p> : (
        <ul className="space-y-2">
          {tasks.map(t=> (
            <li key={t._id} className="flex items-center gap-2 p-2 border rounded">
              <input type="checkbox" checked={t.done} onChange={e=>toggleDone(t._id, e.target.checked)} />
              <span className={t.done? 'line-through opacity-60 flex-1' : 'flex-1'}>{t.text}</span>
              <button onClick={()=>remove(t._id)} className="text-sm text-red-600">Remove</button>
            </li>
          ))}
          {tasks.length===0 && <li className="opacity-70">No tasks yet.</li>}
        </ul>
      )}
    </section>
  )
}
