import { useEffect, useRef, useState, useCallback } from 'react'
import { useDate } from '../contexts/DateContext.jsx'

function formatDateHuman(dStr){
  const d = new Date(dStr + 'T00:00:00')
  return d.toLocaleDateString(undefined,{ month:'short', day:'numeric', year:'numeric' })
}

function daysInMonth(year, month){ return new Date(year, month+1, 0).getDate() }

export default function Calendar(){
  const { date, setDate } = useDate()
  const today = new Date()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const base = new Date(date + 'T00:00:00')
  const [viewYear, setViewYear] = useState(base.getFullYear())
  const [viewMonth, setViewMonth] = useState(base.getMonth())

  const close = useCallback(()=> setOpen(false),[])
  useEffect(()=>{
    if(!open) return
    const onDown = (e) => { if(rootRef.current && !rootRef.current.contains(e.target)) close() }
    const onKey = (e) => { if(e.key==='Escape') close() }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  },[open, close])

  // Re-sync view if external date changes
  useEffect(()=>{ setViewYear(base.getFullYear()); setViewMonth(base.getMonth()) }, [date])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined,{ month:'long', year:'numeric' })
  const firstDow = (()=>{ const d = new Date(viewYear, viewMonth, 1); return (d.getDay()+6)%7 })() // Mon=0
  const dim = daysInMonth(viewYear, viewMonth)
  const cells = []
  for(let i=0;i<firstDow;i++) cells.push(null)
  for(let d=1; d<=dim; d++) cells.push(d)

  const isFuture = (y,m,day) => {
    const cmp = new Date(y, m, day)
    cmp.setHours(0,0,0,0)
    const t = new Date(today); t.setHours(0,0,0,0)
    return cmp.getTime() > t.getTime()
  }

  const selectDay = (d) => {
    if (d == null) return
    if (isFuture(viewYear, viewMonth, d)) return
    const sel = new Date(viewYear, viewMonth, d)
    setDate(sel.toISOString().slice(0,10))
    close()
  }

  const nav = (delta) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0){ m = 11; y -= 1 }
    if (m > 11){ m = 0; y += 1 }
    setViewMonth(m); setViewYear(y)
  }

  return (
    <div className={`ui-dropdown calendar-dropdown ${open ? 'open': ''}`} ref={rootRef}>
      <button type="button" className="ui-dropdown-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
        <span className="dropdown-icon" aria-hidden="true">📅</span>
        <span className="dropdown-label">{formatDateHuman(date)}</span>
        <span className="dropdown-caret" aria-hidden="true">{open? '▲':'▼'}</span>
      </button>
      {open && (
        <div className="ui-dropdown-menu calendar-panel" role="dialog" aria-label="Choose date">
          <div className="cal-head">
            <button type="button" className="cal-nav" onClick={()=>nav(-1)} aria-label="Previous month">‹</button>
            <div className="cal-month" aria-live="polite">{monthLabel}</div>
            <button type="button" className="cal-nav" onClick={()=>nav(1)} aria-label="Next month">›</button>
          </div>
          <div className="cal-grid cal-grid-head">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <div key={d} className="cal-dow">{d}</div>)}
          </div>
          <div className="cal-grid">
            {cells.map((d,i)=>{
              if(d==null) return <div key={i} className="cal-cell empty" />
              const ymd = new Date(viewYear, viewMonth, d).toISOString().slice(0,10)
              const active = ymd === date
              const future = isFuture(viewYear, viewMonth, d)
              return (
                <button
                  key={i}
                  type="button"
                  className={`cal-cell ${active? 'active':''} ${future? 'disabled':''}`}
                  disabled={future}
                  onClick={()=>selectDay(d)}
                >{d}</button>
              )
            })}
          </div>
          <div className="cal-footer">
            <button type="button" className="cal-today" onClick={()=>{ const td = new Date(); setDate(td.toISOString().slice(0,10)); close() }}>Today</button>
          </div>
        </div>
      )}
    </div>
  )
}
