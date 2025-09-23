import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import ToDoPage from './pages/ToDoPage.jsx'
import DiaryPage from './pages/DiaryPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { endpoints } from './lib/api.js'
import Dropdown from './components/Dropdown.jsx'

// Pre-set theme class synchronously to avoid FOUC
try {
  const saved = localStorage.getItem('theme')
  const wantDark = saved ? saved === 'dark' : true
  document.documentElement.classList.toggle('dark', wantDark)
} catch {}

export default function App() {
  const { user, setUser, loading, login, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [prefTheme, setPrefTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      return saved === 'light' ? 'light' : 'dark'
    } catch { return 'dark' }
  })
  const [enable3D, setEnable3D] = useState(false)

  const location = useLocation()
  const navContainerRef = useRef(null)
  const homeRef = useRef(null)
  const diaryRef = useRef(null)
  const dashRef = useRef(null)
  const navRefs = [homeRef, diaryRef, dashRef]
  const routeIndexMap = { '/': 0, '/diary': 1, '/dashboard': 2 }
  const [bgStyle, setBgStyle] = useState({ left: 10, width: 86, radius: '18px 8px 8px 18px', ready: false })

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement
    if ((user?.theme ?? prefTheme) === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [user?.theme, prefTheme])

  // Move background with hover/route
  useEffect(() => {
    const activeIdx = routeIndexMap[location.pathname] ?? 0
    const idx = hoverIndex ?? activeIdx
    const linkEl = navRefs[idx]?.current
    const contEl = navContainerRef.current
    if (!linkEl || !contEl || settingsOpen) return
    const left = linkEl.offsetLeft - 2
    const width = linkEl.offsetWidth + 4
    const last = navRefs.length - 1
    const radius = idx === 0
      ? '18px 8px 8px 18px'
      : idx === last
      ? '8px 18px 18px 8px'
      : '8px'
    setBgStyle({ left, width, radius, ready: true })
  }, [location.pathname, hoverIndex, settingsOpen])

  // Handlers
  const toggleSettings = () => setSettingsOpen(o => !o)
  const closeSettings = () => setSettingsOpen(false)

  const handleThemeChange = async (v) => {
    setPrefTheme(v)
    // Persist locally
    try { localStorage.setItem('theme', v) } catch {}
    // Persist to server and AuthContext if logged in
    try {
      if (user) {
        await endpoints.theme(v)
        setUser({ ...user, theme: v })
      }
    } catch {}
  }

  const exportData = async () => {
    try {
      const res = await endpoints.meExport()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'momentum-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const deleteAccount = async () => {
    const confirmText = window.prompt('Type DELETE to permanently delete your account and all data:')
    if (confirmText === 'DELETE') {
      try {
        await endpoints.meDelete()
        window.location.reload()
      } catch {}
    }
  }

  useEffect(() => {
    // hydrate from localStorage
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') setPrefTheme(saved)
    } catch {}
  }, [])

  return (
    <div className="min-h-full">
      {/* Floating nav (centered pill) */}
      <nav>
        <div className={`nav-outer ${settingsOpen ? 'settings-open' : ''}`}>
          <div className="nav-inner nav-shell" style={{ position: 'relative' }}>
            {/* Standard nav items */}
            <section className={`nav-items ${settingsOpen ? 'hidden-nav' : ''}`} ref={navContainerRef}
              onMouseLeave={() => setHoverIndex(null)}>
              <NavLink to="/" ref={homeRef}
                className={({isActive}) => `nav-pill-link ${isActive ? 'is-active' : ''}`}
                onMouseEnter={() => setHoverIndex(0)}>
                <p>Home</p>
              </NavLink>
              <NavLink to="/diary" ref={diaryRef}
                className={({isActive}) => `nav-pill-link ${isActive ? 'is-active' : ''}`}
                onMouseEnter={() => setHoverIndex(1)}>
                <p>Diary</p>
              </NavLink>
              <NavLink to="/dashboard" ref={dashRef}
                className={({isActive}) => `nav-pill-link ${isActive ? 'is-active' : ''}`}
                onMouseEnter={() => setHoverIndex(2)}>
                <p>Dashboard</p>
              </NavLink>
              {!settingsOpen && (
                <div
                  className="nav-background"
                  aria-hidden="true"
                  style={{ left: bgStyle.left, width: bgStyle.width, borderRadius: bgStyle.radius, opacity: bgStyle.ready ? 1 : 0 }}
                />
              )}
            </section>

            {/* Right controls */}
            <div className={`nav-settings ${settingsOpen ? 'hidden-nav' : ''}`} style={{ position: 'relative' }}>
              <div className="v-divider" />
              <button className="nav-icon-btn" aria-label="Settings" aria-haspopup="menu" aria-expanded={settingsOpen}
                onClick={toggleSettings}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10.91 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0A1.65 1.65 0 0 0 21 12h0a1.65 1.65 0 0 0-1.6 1Z" />
                </svg>
              </button>
            </div>

            {/* Inline settings content inside the pill */}
            {settingsOpen && (
              <section className="settings-panel-inside" role="dialog" aria-label="Settings">
                <header className="settings-header">
                  <div className="settings-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10.91 3V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0A1.65 1.65 0 0 0 21 12h0a1.65 1.65 0 0 0-1.6 1Z" />
                    </svg>
                    <h2>Settings</h2>
                  </div>
                  <button className="nav-icon-btn" aria-label="Close settings" onClick={closeSettings}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"/><path d="M6 6l12 12"/>
                    </svg>
                  </button>
                </header>
                <p className="settings-sub">Adjust your settings using the options below.</p>
                <div className="divider-h"/>
                <div className="settings-grid">
                  <div className="settings-field">
                    <label className="settings-label">Theme</label>
                    <Dropdown
                      label={prefTheme === 'dark' ? 'Dark' : 'Light'}
                      startIcon={
                        prefTheme === 'dark' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.36 6.36-1.42-1.42M8.05 8.05 6.64 6.64m10.72 0-1.41 1.41M8.05 15.95 6.64 17.36"/></svg>
                        )
                      }
                      items={[
                        { key: 'dark', label: 'Dark', selected: prefTheme === 'dark', onSelect: () => handleThemeChange('dark'), icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        ) },
                        { key: 'light', label: 'Light', selected: prefTheme === 'light', onSelect: () => handleThemeChange('light'), icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.36 6.36-1.42-1.42M8.05 8.05 6.64 6.64m10.72 0-1.41 1.41M8.05 15.95 6.64 17.36"/></svg>
                        ) },
                      ]}
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Account</label>
                    <Dropdown
                      label={user?.email || 'Guest'}
                      startIcon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
                      }
                      items={[
                        { key: 'export', label: 'Export My Data', icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 15V5"/></svg>
                        ), onSelect: exportData },
                        { divider: true },
                        user ? { key: 'delete', label: 'Delete My Account', destructive: true, icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M14 11v6"/><path d="M10 11v6"/><path d="M18 6l-1-3H7L6 6"/></svg>
                        ), onSelect: deleteAccount } : null,
                        user ? { key: 'logout', label: 'Log Out', icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                        ), onSelect: () => { logout(); closeSettings(); } } : { key: 'login', label: 'Log In', icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
                        ), onSelect: () => { login(); closeSettings(); } },
                      ].filter(Boolean)}
                    />
                  </div>
                </div>
              </section>
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
