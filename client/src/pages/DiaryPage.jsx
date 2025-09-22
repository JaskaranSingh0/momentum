import { useEffect, useRef, useState } from 'react'
import Calendar from '../components/Calendar.jsx'
import WeekBar from '../components/WeekBar.jsx'
import { useDate } from '../contexts/DateContext.jsx'
import { endpoints } from '../lib/api.js'

export default function DiaryPage() {
  const { date } = useDate()
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const timer = useRef(null)

  const load = async () => {
    setStatus('Loading…')
    const { entry } = await endpoints.diary.get(date)
    setText(entry.text || '')
    setStatus('')
  }

  useEffect(()=>{ load() }, [date])

  useEffect(()=>{
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await endpoints.diary.put(date, text)
        setStatus('Saved')
        setTimeout(()=>setStatus(''), 1000)
      } catch {
        setStatus('Error saving')
      }
    }, 500)
    return () => clearTimeout(timer.current)
  }, [text, date])

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Daily Diary</h1>
      <Calendar />
      <WeekBar />
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your thoughts…"
        className="w-full h-64 border rounded p-3 bg-transparent" />
      <div className="text-sm opacity-70 mt-2">{status}</div>
    </section>
  )
}
