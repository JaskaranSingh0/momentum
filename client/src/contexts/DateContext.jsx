import { createContext, useContext, useMemo, useState } from 'react'

function toYMD(d) { return d.toISOString().slice(0,10) }

const DateCtx = createContext(null)

export function DateProvider({ children }) {
  const [date, setDate] = useState(toYMD(new Date()))
  const value = useMemo(() => ({ date, setDate }), [date])
  return <DateCtx.Provider value={value}>{children}</DateCtx.Provider>
}

export function useDate() { return useContext(DateCtx) }
