import { useState, useRef, useEffect, useCallback } from 'react'
import { useDate } from '../contexts/DateContext.jsx'

// Helper utilities
function parseYMD(ymd){ const [y,m,d] = ymd.split('-').map(Number); return new Date(y, m-1, d) }
function formatYMD(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }

export default function Calendar({ inline=false }){
  const { date, setDate } = useDate()
  const [open, setOpen] = useState(false)
  const selected = parseYMD(date)
  const [view, setView] = useState(()=> new Date(selected.getFullYear(), selected.getMonth(), 1))
  const wrapRef = useRef(null)
  const gridRef = useRef(null)

  const close = useCallback(()=> setOpen(false), [])

  // Close on outside click / Escape
  useEffect(()=>{
    if(!open) return
    const onKey = (e) => { if(e.key==='Escape') close() }
    const onClick = (e) => { if(wrapRef.current && !wrapRef.current.contains(e.target)) close() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick) }
  }, [open, close])

  useEffect(()=>{ // keep view in sync if external date changes
    const d = parseYMD(date)
    setView(v=> sameDay(d, v) || (d.getMonth()===v.getMonth() && d.getFullYear()===v.getFullYear()) ? v : new Date(d.getFullYear(), d.getMonth(), 1))
  }, [date])

  const daysInMonth = (y,m) => new Date(y, m+1, 0).getDate()
  const startWeekday = (d) => (new Date(d.getFullYear(), d.getMonth(), 1).getDay()) // 0 Sun .. 6 Sat

  const buildGrid = () => {
    const y = view.getFullYear(); const m = view.getMonth();
    const dim = daysInMonth(y,m)
    const offset = startWeekday(view)
    const cells = []
    for (let i=0;i<offset;i++) cells.push(null)
    for (let d=1; d<=dim; d++) cells.push(new Date(y,m,d))
    // pad to complete weeks
    while (cells.length % 7 !==0) cells.push(null)
    return cells
  }

  const weeks = (()=>{
    const cells = buildGrid()
    const w = []
    for (let i=0;i<cells.length;i+=7) w.push(cells.slice(i,i+7))
    return w
  })()

  const today = new Date()

  const selectDay = (d) => { if(!d) return; setDate(formatYMD(d)); close() }

  // Keyboard navigation inside grid
  const onGridKey = (e) => {
    const focusEl = document.activeElement
    if (!gridRef.current || !gridRef.current.contains(focusEl)) return
    const buttons = Array.from(gridRef.current.querySelectorAll('button[data-day]'))
    const idx = buttons.indexOf(focusEl)
    if (idx===-1) return
    let nextIdx = idx
    switch(e.key){
      case 'ArrowRight': nextIdx = idx+1; break
      case 'ArrowLeft': nextIdx = idx-1; break
      case 'ArrowDown': nextIdx = idx+7; break
      case 'ArrowUp': nextIdx = idx-7; break
      case 'Home': nextIdx = Math.floor(idx/7)*7; break
      case 'End': nextIdx = Math.floor(idx/7)*7 + 6; break
      case 'PageUp': {
        // previous month
        setView(v=> new Date(v.getFullYear(), v.getMonth()-1, 1)); e.preventDefault(); return
      }
      case 'PageDown': {
        setView(v=> new Date(v.getFullYear(), v.getMonth()+1, 1)); e.preventDefault(); return
      }
      case 'Enter': case ' ': focusEl.click(); e.preventDefault(); return
      default: return
    }
    e.preventDefault()
    if(nextIdx>=0 && nextIdx<buttons.length){ buttons[nextIdx].focus() }
  }

  useEffect(()=>{
    if(!open) return
    const h = (e) => onGridKey(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  // Mobile: keep native input as fallback (media query detection simplest via CSS hidden utility)
  return (
    <div className={`date-picker${inline? '':' mb-4'}`} ref={wrapRef}>
      {!inline && <div className="text-xs font-medium mb-1 opacity-70">Date</div>}
      <button type="button" className="date-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
        <span className="date-trigger-label">{date}</span>
        <span className="date-trigger-caret" aria-hidden="true">{open? '▲':'▼'}</span>
      </button>
      {open && (
        <div className="date-pop" role="dialog" aria-label="Choose date" data-open>
          <div className="date-pop-inner">
            <div className="date-pop-header">
              <button className="nav-btn" onClick={()=>setView(v=> new Date(v.getFullYear(), v.getMonth()-1, 1))} aria-label="Previous month">‹</button>
              <div className="month-label">{view.toLocaleString(undefined, { month:'long', year:'numeric' })}</div>
              <button className="nav-btn" onClick={()=>setView(v=> new Date(v.getFullYear(), v.getMonth()+1, 1))} aria-label="Next month">›</button>
            </div>
            <div className="dow-row" aria-hidden="true">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="dow-cell">{d}</div>)}
            </div>
            <div className="grid" ref={gridRef}>
              {weeks.map((w,i)=>(
                <div className="week" key={i}>
                  {w.map((d,ii)=>{
                    if(!d) return <div key={ii} className="day empty" />
                    const isSelected = sameDay(d, selected)
                    const isToday = sameDay(d, today)
                    return (
                      <button
                        key={ii}
                        type="button"
                        data-day
                        className={`day${isSelected? ' sel':''}${isToday? ' today':''}`}
                        aria-pressed={isSelected}
                        aria-current={isToday? 'date': undefined}
                        onClick={()=>selectDay(d)}
                      >{d.getDate()}</button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="date-pop-footer">
              <button className="ui-button text-xs" onClick={()=>{ const t=new Date(); setDate(formatYMD(t)); setView(new Date(t.getFullYear(), t.getMonth(),1)); close() }}>Today</button>
              <button className="ui-button text-xs" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
