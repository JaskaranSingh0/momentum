import clsx from 'clsx'

export default function TaskItem({ task, onToggle, onDelete, onEdit, selectionMode = false, selected = false, onSelectToggle, isFocused = false }) {

  return (
    <div className={clsx('task-row group flex items-center gap-3 rounded-xl px-3 py-2 border', 'card', isFocused && 'ring-1')}
      style={{ borderColor: isFocused ? 'var(--color-accent)' : 'var(--border-hairline)', boxShadow: isFocused ? '0 0 0 1px var(--color-accent) inset' : undefined, background: 'transparent' }}>
      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectToggle?.(task)}
          className="h-4 w-4"
          aria-label={selected ? 'Deselect' : 'Select'}
        />
      )}
      <button
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        onClick={() => onToggle(task)}
        className={clsx('h-5 w-5 rounded-full border flex items-center justify-center transition-all')}
        style={{ borderColor: 'var(--border-hairline)' }}
      >
        {task.done && (
          <svg width="12" height="12" viewBox="0 0 24 24" className="stroke-current"><path d="M20 6L9 17l-5-5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>

      <div className={clsx('flex-1 text-sm', task.done && 'opacity-60 line-through')}>
        {task.text}
      </div>

      {task.priority ? (
        <span className="text-[11px] px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border-hairline)' }}>{String(task.priority).toUpperCase()}</span>
      ) : null}

      {/* Category/labels removed from inline row per request (still available in hover preview & edit pill) */}

      <button aria-label="Edit task" onClick={() => onEdit?.(task)} className="opacity-0 group-hover:opacity-100 transition-opacity mr-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
      </button>
      <button aria-label="Delete task" onClick={() => onDelete(task)} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M14 11v6"/><path d="M10 11v6"/><path d="M18 6l-1-3H7L6 6"/></svg>
      </button>
    </div>
  )
}
