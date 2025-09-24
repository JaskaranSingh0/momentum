import React from 'react'

// moods prop: [{ key, icon, label }]
// value: current mood key or null
// onChange: (newMood|null) => void
export default function MoodBar({ moods, value, onChange, label = 'Mood' }) {
  return (
    <div className="mood-bar" role="group" aria-label={label}>
      <span className="mood-bar-label">{label.toUpperCase()}:</span>
      <div className="mood-bar-pills">
        {moods.map(m => {
          const active = value === m.key
          return (
            <button
              key={m.key}
              type="button"
              className={`mood-pill${active ? ' active' : ''}`}
              data-mood={m.key}
              aria-pressed={active}
              title={m.label}
              onClick={() => onChange(active ? null : m.key)}
            >
              <span className="mood-emoji" aria-hidden="true">{m.icon}</span>
              <span className="mood-name">{m.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
