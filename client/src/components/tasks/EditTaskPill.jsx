import { useEffect, useMemo, useRef, useState } from 'react'
import Dropdown from '../Dropdown.jsx'

export default function EditTaskPill({ task, onSave, onCancel, categories = [] }) {
  const [title, setTitle] = useState(task.text || '')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [description, setDescription] = useState(task.description || '')
  const [recurrenceType, setRecurrenceType] = useState(task.recurrence?.type || 'daily')
  const [weeklyDays, setWeeklyDays] = useState(task.recurrence?.daysOfWeek || [])
  const [monthlyDom, setMonthlyDom] = useState(task.recurrence?.dayOfMonth || '')
  const [dueDate, setDueDate] = useState(task.dueAt ? new Date(task.dueAt).toISOString().slice(0,10) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [repeatMenuHeight, setRepeatMenuHeight] = useState(0)
  // Category editing
  const initialCategory = (Array.isArray(task.labels) && task.labels.length ? task.labels[0].toUpperCase() : '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory) // '' means none
  const [creatingNewCat, setCreatingNewCat] = useState(false)
  const [newCatValue, setNewCatValue] = useState('')
  const newCatInputRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Allow Esc to close while typing inside the edit pill
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel?.();
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  const canSubmit = useMemo(() => title.trim().length > 0 && !loading, [title, loading])

  const buildPatch = () => {
    const rec = (() => {
      if (recurrenceType === 'weekly') return { type: 'weekly', daysOfWeek: weeklyDays }
      if (recurrenceType === 'monthly') return { type: 'monthly', dayOfMonth: monthlyDom ? Number(monthlyDom) : null }
      if (recurrenceType === 'yearly') return { type: 'yearly' }
      if (recurrenceType === 'one-time') return { type: 'one-time' }
      return { type: 'daily' }
    })()
    const patch = { text: title, description, recurrence: rec, priority }
    if (recurrenceType === 'one-time') patch.dueAt = dueDate ? new Date(dueDate).toISOString() : null
    else patch.dueAt = null
    // Category change logic (only modify labels if changed)
  const finalCategory = (creatingNewCat && newCatValue.trim() ? newCatValue.trim() : selectedCategory).toUpperCase()
    if (finalCategory !== initialCategory) {
      const current = Array.isArray(task.labels) ? [...task.labels] : []
      if (finalCategory === '') {
        if (current.length) { current.shift(); patch.labels = current }
        else patch.labels = []
      } else {
        if (current.length === 0) patch.labels = [finalCategory]
        else { current[0] = finalCategory; patch.labels = current }
      }
    }
    return patch
  }

  return (
    <div className="mt-2 add-pill" style={{ paddingBottom: repeatMenuHeight ? 12 + repeatMenuHeight + 8 : undefined }}>
      <div className="add-pill-fields">
        <input ref={inputRef} className="ui-input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Task title" />
  <textarea className="ui-textarea desc-textarea" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description (optional)" />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm opacity-70" style={{minWidth:56}}>Priority</span>
          <div className="flex items-center gap-6">
            {['low','medium','high'].map(p => (
              <button key={p} type="button" className={`chip ${priority===p ? 'active': ''}`} onClick={() => setPriority(p)}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm opacity-70" style={{minWidth:56}}>Category</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className={`chip ${selectedCategory === '' && !creatingNewCat ? 'active' : ''}`} onClick={() => { setSelectedCategory(''); setCreatingNewCat(false) }}>GENERAL</button>
            {categories.filter(Boolean).map(c => c.toUpperCase()).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a.localeCompare(b)).map(cat => (
              <button
                key={cat}
                type="button"
                className={`chip ${!creatingNewCat && selectedCategory === cat ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(c => c === cat ? '' : cat); setCreatingNewCat(false) }}
              >{cat}</button>
            ))}
            {!creatingNewCat && (
              <button type="button" className={`chip ${creatingNewCat ? 'active' : ''}`} onClick={() => { setCreatingNewCat(true); setTimeout(()=>newCatInputRef.current?.focus(), 0) }}>+ New</button>
            )}
            {creatingNewCat && (
              <input
                ref={newCatInputRef}
                className="ui-input"
                style={{ width: 140 }}
                placeholder="New category"
                value={newCatValue}
                onChange={e => setNewCatValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); if (newCatValue.trim()) { setSelectedCategory(newCatValue.trim()); setCreatingNewCat(false) } }
                  else if (e.key === 'Escape') { e.preventDefault(); setCreatingNewCat(false); setNewCatValue('') }
                }}
              />
            )}
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
        <button className="ui-button" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="ui-button accent" disabled={!canSubmit || loading} onClick={() => onSave(buildPatch())}>{loading ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}
