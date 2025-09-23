import { useEffect, useMemo, useRef, useState } from 'react'
import { endpoints } from '../../lib/api.js'
import { parseQuickAdd } from '../../lib/parseQuickAdd.js'
import Dropdown from '../Dropdown.jsx'

export default function AddTaskPill({ date, onAdded, open, onOpenChange }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('') // YYYY-MM-DD
  const [recurrenceType, setRecurrenceType] = useState('daily')
  const [weeklyDays, setWeeklyDays] = useState([]) // [0..6]
  const [monthlyDom, setMonthlyDom] = useState('') // 1..31
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [repeatMenuHeight, setRepeatMenuHeight] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const canSubmit = useMemo(() => title.trim().length > 0 && !loading, [title, loading])

  const close = () => {
    onOpenChange?.(false)
  setTimeout(() => { setTitle(''); setPriority('medium'); setDescription(''); setDueDate(''); setRecurrenceType('daily'); setWeeklyDays([]); setMonthlyDom(''); setError('') }, 200)
  }

  const handleAdd = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const parsed = parseQuickAdd(title)
      // If user manually picked a priority, override parsed
      if (priority && priority !== 'medium') parsed.priority = priority
      // If user manually picked a priority, override parsed one
      if (priority && priority !== 'medium') parsed.priority = priority
      const rec = (() => {
        if (recurrenceType === 'weekly') return { type: 'weekly', daysOfWeek: weeklyDays }
        if (recurrenceType === 'monthly') return { type: 'monthly', dayOfMonth: monthlyDom ? Number(monthlyDom) : null }
        if (recurrenceType === 'yearly') return { type: 'yearly' }
        if (recurrenceType === 'one-time') return { type: 'one-time' }
        return { type: 'daily' }
      })()
  const base = { carryForward: true, description, recurrence: rec, ...(parsed.priority && parsed.priority !== 'medium' ? { priority: parsed.priority } : {}) }
  const payload = recurrenceType === 'one-time' && dueDate ? { ...base, dueAt: new Date(dueDate).toISOString() } : base
  const { task } = await endpoints.tasks.create(date, parsed.title, payload)
      const patch = {}
      if (parsed.priority && parsed.priority !== 'medium') patch.priority = parsed.priority
      if (parsed.labels && parsed.labels.length) patch.labels = parsed.labels
  if (recurrenceType === 'one-time' && parsed.dueAt) patch.dueAt = parsed.dueAt
      if (Object.keys(patch).length) {
        const upd = await endpoints.tasks.update(task._id, patch)
        onAdded?.(upd.task)
      } else {
        onAdded?.(task)
      }
      close()
    } catch (e) {
      setError('Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return
      if (e.key === 'Escape') { e.preventDefault(); close() }
      if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, title, priority, loading])

  if (!open) {
    return (
      <div className="add-task-wrap">
        <button className="ui-button accent" onClick={() => onOpenChange?.(true)} title="Add task (N)">
          <span style={{marginRight:8, display:'inline-flex'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          Add Task
        </button>
      </div>
    )
  }

  return (
    <div className="add-task-wrap">
      <div className="add-pill open" style={{ paddingBottom: repeatMenuHeight ? 12 + repeatMenuHeight + 8 : undefined }}>
        <div className="add-pill-fields">
          <input
            ref={inputRef}
            className="ui-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title… e.g. Write brief !high #work 5pm"
          />
          <textarea className="ui-textarea desc-textarea" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description (optional)" />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm opacity-70" style={{minWidth:56}}>Priority</span>
            <div className="flex items-center gap-6">
              {['low','medium','high'].map(p => (
                <button key={p} type="button" className={`chip ${priority===p ? 'active': ''}`} onClick={() => setPriority(p)}>
                  {p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {recurrenceType === 'one-time' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm opacity-70" style={{minWidth:56}}>Due</span>
              <input type="date" className="ui-input" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} style={{maxWidth:220}} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm opacity-70" style={{minWidth:56}}>Repeat</span>
            <Dropdown
              className="inline-block"
              label={`Repeat: ${
                recurrenceType === 'daily' ? 'Daily' :
                recurrenceType === 'weekly' ? 'Weekly' :
                recurrenceType === 'monthly' ? 'Monthly' :
                recurrenceType === 'yearly' ? 'Yearly' : 'One-time'
              }`}
              items={[
                { key:'daily', label:'Daily', selected: recurrenceType==='daily', onSelect: () => setRecurrenceType('daily') },
                { key:'weekly', label:'Weekly', selected: recurrenceType==='weekly', onSelect: () => setRecurrenceType('weekly') },
                { key:'monthly', label:'Monthly', selected: recurrenceType==='monthly', onSelect: () => setRecurrenceType('monthly') },
                { key:'yearly', label:'Yearly', selected: recurrenceType==='yearly', onSelect: () => setRecurrenceType('yearly') },
                { key:'one-time', label:'One-time', selected: recurrenceType==='one-time', onSelect: () => setRecurrenceType('one-time') },
              ]}
              onOpenChange={(isOpen, height) => setRepeatMenuHeight(isOpen ? height : 0)}
            />
            {recurrenceType === 'weekly' && (
              <div className="flex items-center gap-1 ml-2">
                {[0,1,2,3,4,5,6].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`chip ${weeklyDays.includes(d)?'active':''}`}
                    onClick={() => setWeeklyDays(ws => ws.includes(d) ? ws.filter(x=>x!==d) : [...ws, d])}
                  >{['S','M','T','W','T','F','S'][d]}</button>
                ))}
              </div>
            )}
            {recurrenceType === 'monthly' && (
              <input type="number" min="1" max="31" className="ui-input ml-2" style={{maxWidth:120}} placeholder="Day of month" value={monthlyDom} onChange={(e)=>setMonthlyDom(e.target.value)} />
            )}
          </div>
        </div>
        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        <div className="add-pill-actions">
          <button className="ui-button" onClick={close} disabled={loading}>Cancel</button>
          <button className="ui-button accent" onClick={handleAdd} disabled={!canSubmit}>{loading ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}
