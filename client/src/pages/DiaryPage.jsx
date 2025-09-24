import { useEffect, useRef, useState, useCallback } from 'react'
import Calendar from '../components/Calendar.jsx'
import WeekBar from '../components/WeekBar.jsx'
import { useDate } from '../contexts/DateContext.jsx'
import { endpoints } from '../lib/api.js'

export default function DiaryPage() {
  const { date, setDate } = useDate()
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [streak, setStreak] = useState(0)
  const [streakLoading, setStreakLoading] = useState(false)
  const [mood, setMood] = useState(null)
  const [focusMode, setFocusMode] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)
  // Prompt system removed
  const [wordGoal, setWordGoal] = useState(() => { try { return Number(localStorage.getItem('diaryWordGoal')) || 200 } catch { return 200 } })
  const timer = useRef(null)
  const computingStreakRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const offlineQueueRef = useRef([])
  const liveRegionRef = useRef(null)
  const [moodOpen, setMoodOpen] = useState(false)
  const moodWrapRef = useRef(null)

  const load = useCallback(async () => {
    setStatus('Loading…')
    try {
      const { entry } = await endpoints.diary.get(date)
      setText(entry.text || '')
      setMood(entry.mood || null)
      setStatus('')
    } catch {
      setStatus('Error loading')
    }
  }, [date])

  useEffect(()=>{ load() }, [date, load])

  // Helper to format Date -> YYYY-MM-DD
  const fmt = (d) => d.toISOString().slice(0,10)

  const computeStreak = async () => {
    if (computingStreakRef.current) return
    computingStreakRef.current = true
    setStreakLoading(true)
    try {
      let count = 0
      const limit = 90 // safety cap
      for (let i=0;i<limit;i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const ds = fmt(d)
        try {
          const { entry } = await endpoints.diary.get(ds)
          const hasContent = !!(entry && entry.text && entry.text.trim().length > 0)
          if (hasContent) count += 1
          else break
        } catch {
          break
        }
      }
      setStreak(count)
    } finally {
      setStreakLoading(false)
      computingStreakRef.current = false
    }
  }

  // Initial streak load on mount
  useEffect(() => { computeStreak() }, [])

  // Close mood panel on outside click / Escape
  useEffect(()=>{
    if(!moodOpen) return
    const onKey = (e) => { if(e.key==='Escape') setMoodOpen(false) }
    const onClick = (e) => { if(moodWrapRef.current && !moodWrapRef.current.contains(e.target)) setMoodOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick) }
  }, [moodOpen])

  const enqueueSave = useCallback((payload) => {
    // merge if last in queue is same date to avoid duplication
    const q = offlineQueueRef.current
    if (q.length && q[q.length-1].date === payload.date) {
      q[q.length-1] = payload
    } else {
      q.push(payload)
    }
  }, [])

  const processQueue = useCallback(async () => {
    if (!offlineQueueRef.current.length || offline) return
    const item = offlineQueueRef.current[0]
    try {
      await endpoints.diary.put(item.date, item.text, item.mood)
      offlineQueueRef.current.shift()
      if (item.date === date) {
        setStatus('Saved')
        liveRegionRef.current && (liveRegionRef.current.textContent = 'Entry saved')
        setTimeout(()=>{ if(!pendingSaveRef.current) setStatus('') }, 1200)
      }
      if (offlineQueueRef.current.length) {
        processQueue()
      }
    } catch {
      // leave item in queue for retry
      setStatus('Offline - pending save')
      liveRegionRef.current && (liveRegionRef.current.textContent = 'Offline. Save pending')
    }
  }, [date, offline])

  useEffect(()=>{
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      pendingSaveRef.current = true
      const payload = { date, text, mood }
      if (offline) {
        enqueueSave(payload)
        setStatus('Offline - pending save')
        liveRegionRef.current && (liveRegionRef.current.textContent = 'Offline. Save queued')
        return
      }
      try {
        await endpoints.diary.put(date, text, mood)
        pendingSaveRef.current = false
        setStatus('Saved')
        liveRegionRef.current && (liveRegionRef.current.textContent = 'Entry saved')
        setTimeout(()=>{ if(!pendingSaveRef.current) setStatus('') }, 1200)
        const today = fmt(new Date())
        if (date === today) computeStreak()
      } catch {
        enqueueSave(payload)
        setStatus('Offline - pending save')
        liveRegionRef.current && (liveRegionRef.current.textContent = 'Offline. Save queued')
      }
    }, 500)
    return () => clearTimeout(timer.current)
  }, [text, date, mood, offline, enqueueSave])

  useEffect(() => {
    const onOff = () => { setOffline(true); liveRegionRef.current && (liveRegionRef.current.textContent = 'Offline') }
    const onOn = () => { setOffline(false); setStatus('Reconnecting…'); liveRegionRef.current && (liveRegionRef.current.textContent = 'Online. Syncing'); processQueue() }
    window.addEventListener('offline', onOff)
    window.addEventListener('online', onOn)
    return () => { window.removeEventListener('offline', onOff); window.removeEventListener('online', onOn) }
  }, [processQueue])

  const wordCount = (() => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).filter(Boolean).length
  })()
  const charCount = text.length

  const moods = [
    { key:'sad', icon:'😔', label:'Sad' },
    { key:'meh', icon:'😐', label:'Neutral' },
    { key:'calm', icon:'🙂', label:'Calm' },
  { key:'happy', icon:'😄', label:'Happy' },
    { key:'tired', icon:'😴', label:'Tired' },
    { key:'stressed', icon:'😣', label:'Stressed' },
    { key:'anxious', icon:'😟', label:'Anxious' },
  { key:'excited', icon:'🤩', label:'Excited' },
  { key:'focused', icon:'🎯', label:'Focused' },
  { key:'angry', icon:'😡', label:'Angry' },
  ]

  // Prompt system removed
  const changeDay = (delta) => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate()+delta); setDate(fmt(d)) }
  const wordCountPct = Math.min(100, Math.round((wordCount / wordGoal) * 100))
  // Export removed (global data export exists in settings)

  return (
    <section className="page-container">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-4xl">Daily Diary</h1>
        <div className="flex items-center gap-2 text-sm">
          <button className="ui-button" onClick={()=>changeDay(-1)} aria-label="Previous day">◀</button>
          <div className="opacity-70">{date}</div>
          <button className="ui-button" onClick={()=>changeDay(1)} aria-label="Next day">▶</button>
          <button className={`ui-button ${focusMode ? 'accent':''}`} onClick={()=>setFocusMode(f=>!f)}>{focusMode ? 'Exit Focus' : 'Focus'}</button>
          {/* Export button removed – consolidated under global data export in settings */}
        </div>
      </div>
      <div className="card pad-lg">
        {!focusMode && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 transition-opacity">
            <Calendar />
            <WeekBar />
          </div>
        )}
        {/* Mood morphing pill + goal */}
        <div className="mb-4 flex flex-col gap-3">
          <div className={`mood-pill-wrap ${moodOpen ? 'open': ''}`} ref={moodWrapRef}>
            <div className="mood-pill-header" onClick={()=>setMoodOpen(o=>!o)} role="button" tabIndex={0} aria-expanded={moodOpen} onKeyDown={e=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); setMoodOpen(o=>!o) } } }>
              <span className="mood-pill-title">Mood</span>
              <span className="mood-pill-current">{mood ? moods.find(m=>m.key===mood)?.icon : '—'}</span>
              <span className="mood-pill-caret" aria-hidden="true">{moodOpen ? '▲' : '▼'}</span>
            </div>
            <div className="mood-pill-content" aria-hidden={!moodOpen}>
              <div className="mood-grid">
                {moods.map(mo => {
                  const active = mood === mo.key
                  return (
                    <button
                      key={mo.key}
                      type="button"
                      className={`mood-select-btn ${active ? 'active': ''}`}
                      aria-pressed={active}
                      onClick={()=>{ setMood(active?null:mo.key); setMoodOpen(false) }}
                      title={mo.label}
                    >
                      <span className="mood-emoji" aria-hidden="true">{mo.icon}</span>
                      <span className="mood-label-text">{mo.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70 flex-wrap">
            <label htmlFor="word-goal" className="font-medium">Word Goal:</label>
            <input
              id="word-goal"
              type="number"
              min={50}
              step={50}
              value={wordGoal}
              onChange={e=>{ const v = Number(e.target.value)||0; setWordGoal(v); try{ localStorage.setItem('diaryWordGoal', String(v)) }catch{} }}
              className="ui-input !w-24 !py-1 !px-2 text-sm"
            />
          </div>
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your thoughts…" className={`ui-textarea ${focusMode ? 'focus-mode-area':''}`} />
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-[rgba(127,127,127,0.15)] overflow-hidden">
            <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${wordCountPct}%` }} />
          </div>
          <div className="text-xs opacity-60 mt-1 flex gap-4 flex-wrap">
            <span>{wordCount}/{wordGoal} words ({wordCountPct}%)</span>
            {offline && <span className="text-amber-400">Offline</span>}
          </div>
        </div>
        <div className="text-sm opacity-70 mt-3 flex flex-wrap gap-4 items-center">
          {status && <span>{status}</span>}
          <span>Words: {wordCount}</span>
          <span>Chars: {charCount}</span>
          <span>Streak: {streakLoading ? '…' : `${streak} day${streak===1?'':'s'}`}</span>
          {mood && <span>Mood: {moods.find(m=>m.key===mood)?.label}</span>}
        </div>
        <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRegionRef}></div>
      </div>
    </section>
  )
}
