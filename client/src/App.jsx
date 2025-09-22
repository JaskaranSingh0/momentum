import { Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ToDoPage from './pages/ToDoPage.jsx'
import DiaryPage from './pages/DiaryPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { useAuth } from './contexts/AuthContext.jsx'

export default function App() {
  const { user, loading, login, logout } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Apply theme class to html
    const root = document.documentElement
    if (user?.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [user?.theme])

  return (
    <div className="min-h-full bg-white text-gray-900 dark:bg-zinc-900 dark:text-zinc-100">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-semibold">Momentum</div>
          <button className="md:hidden text-sm border rounded px-2 py-1" onClick={()=>setOpen(o=>!o)}>Menu</button>
          <div className={`text-sm md:flex md:items-center md:space-x-4 ${open? '' : 'hidden md:block'}`}>
            <NavLink to="/" className={({isActive}) => `hover:underline ${isActive ? 'underline' : ''}`}>To-Do List</NavLink>
            <NavLink to="/diary" className={({isActive}) => `hover:underline ${isActive ? 'underline' : ''}`}>Daily Diary</NavLink>
            <NavLink to="/dashboard" className={({isActive}) => `hover:underline ${isActive ? 'underline' : ''}`}>Dashboard</NavLink>
            {loading ? (
              <span className="opacity-70">Loading…</span>
            ) : user ? (
              <button className="ml-2 underline" onClick={logout}>Log Out</button>
            ) : (
              <button className="ml-2 underline" onClick={login}>Log In with Google</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <p className="opacity-70">Loading…</p>
        ) : (
        <Routes>
          <Route index element={<ToDoPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
        )}
      </main>
    </div>
  )
}
