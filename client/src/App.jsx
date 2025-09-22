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
  {/* Mobile top bar (hidden; using floating nav for all sizes) */}
  <nav className="glass-nav hairline px-4 hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 relative">
          <div className="font-semibold tracking-tight">Momentum</div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? '' : ''}`}>To-Do List</NavLink>
            <NavLink to="/diary" className={({isActive}) => `nav-link ${isActive ? '' : ''}`}>Daily Diary</NavLink>
            <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? '' : ''}`}>Dashboard</NavLink>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm">
            {loading ? (
              <span className="opacity-70">Loading…</span>
            ) : user ? (
              <button className="nav-link" onClick={logout}>Log Out</button>
            ) : (
              <button className="nav-link" onClick={login}>Log In</button>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button className="text-sm border rounded px-2 py-1" onClick={()=>setOpen(o=>!o)}>Menu</button>
            {open && (
              <div className="nav-panel">
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <div>
                    <NavLink to="/" className="nav-link block" onClick={()=>setOpen(false)}>To-Do List</NavLink>
                    <NavLink to="/diary" className="nav-link block" onClick={()=>setOpen(false)}>Daily Diary</NavLink>
                    <NavLink to="/dashboard" className="nav-link block" onClick={()=>setOpen(false)}>Dashboard</NavLink>
                  </div>
                  <div>
                    {loading ? (
                      <span className="block px-3 py-2 opacity-70">Loading…</span>
                    ) : user ? (
                      <button className="nav-link" onClick={()=>{ setOpen(false); logout(); }}>Log Out</button>
                    ) : (
                      <button className="nav-link" onClick={()=>{ setOpen(false); login(); }}>Log In</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

  {/* Floating nav (centered pill) */}
  <nav>
        <div className="nav-outer">
          <div className="nav-inner">
            <section className="nav-items">
              <NavLink to="/" className={({isActive}) => `nav-pill-link ${isActive ? 'is-active' : ''}`}>
                <p>Home</p>
              </NavLink>
              <NavLink to="/diary" className={({isActive}) => `nav-pill-link ${isActive ? 'is-active' : ''}`}>
                <p>Diary</p>
              </NavLink>
              <NavLink to="/dashboard" className={({isActive}) => `nav-pill-link ${isActive ? 'is-active' : ''}`}>
                <p>Dashboard</p>
              </NavLink>
              <div className="nav-background" aria-hidden="true" />
            </section>
            <div className="nav-settings">
              <div className="v-divider" />
              {loading ? (
                <button className="nav-pill-link" disabled><p>Loading…</p></button>
              ) : user ? (
                <button className="nav-pill-link" onClick={logout}><p>Log Out</p></button>
              ) : (
                <button className="nav-pill-link" onClick={login}><p>Log In</p></button>
              )}
            </div>
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
