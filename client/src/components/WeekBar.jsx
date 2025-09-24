import { useMemo } from 'react'
import { useDate } from '../contexts/DateContext.jsx'

function toYMD(d){ return d.toISOString().slice(0,10) }

export default function WeekBar(){
  const { date, setDate } = useDate()
  const week = useMemo(() => {
    const now = new Date(date)
    const dow = (now.getDay()+6)%7 // 0=Mon
    const start = new Date(now); start.setDate(now.getDate()-dow)
    return Array.from({length:7},(_,i)=>{
      const d = new Date(start); d.setDate(start.getDate()+i)
      return toYMD(d)
    })
  }, [date])

  const dayLabel = d => new Date(d).toLocaleDateString(undefined,{weekday:'short'})

  return (
  <div className="flex gap-2 mb-4">
      {week.map(d=> (
        <button key={d} onClick={()=>setDate(d)}
      className={`chip text-sm ${d===date? 'active' : ''}`}>
          {dayLabel(d)}
        </button>
      ))}
    </div>
  )
}
