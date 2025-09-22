import { useDate } from '../contexts/DateContext.jsx'

export default function Calendar(){
  const { date, setDate } = useDate()
  return (
    <label className="text-sm block mb-4">Select date:
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="ml-2 border rounded px-2 py-1 bg-transparent" />
    </label>
  )
}
