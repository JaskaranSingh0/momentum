import { useEffect, useRef, useState } from 'react'

export default function Dropdown({
  label,
  startIcon,
  items = [],
  disabled = false,
  className = '',
  onOpenChange,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function onItemClick(it) {
    if (it.onSelect) it.onSelect()
    setOpen(false)
  }

  useEffect(() => {
    if (typeof onOpenChange !== 'function') return
    if (open) {
      // Wait for menu to render then measure
      const r = () => {
        const h = menuRef.current ? menuRef.current.offsetHeight : 0
        try { onOpenChange(true, h) } catch (_) {}
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(r)
      else setTimeout(r, 0)
    } else {
      try { onOpenChange(false, 0) } catch (_) {}
    }
  }, [open, onOpenChange])

  return (
    <div className={`ui-dropdown ${className}`} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="ui-dropdown-trigger"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {startIcon ? <span className="dropdown-icon" aria-hidden>{startIcon}</span> : null}
        <span className="dropdown-label">{label}</span>
        <span className="dropdown-caret" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      {open && (
        <div className="ui-dropdown-menu" role="menu" ref={menuRef}>
          {items.map((it, idx) => {
            if (it.divider) return <div key={`div-${idx}`} className="ui-menu-divider" />
            const { key, label, icon, destructive, selected } = it
            return (
              <button
                key={key || idx}
                type="button"
                role="menuitem"
                className={`ui-menu-item${destructive ? ' destructive' : ''}`}
                onClick={() => onItemClick(it)}
              >
                {icon ? <span className="menu-icon" aria-hidden>{icon}</span> : <span className="menu-icon" />}
                <span className="menu-label">{label}</span>
                <span className="menu-check" aria-hidden>
                  {selected ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11L4 12"/></svg>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
