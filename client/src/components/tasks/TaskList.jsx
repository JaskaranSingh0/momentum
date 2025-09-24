import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState, useRef } from 'react'
import TaskItem from './TaskItem.jsx'
import EditTaskPill from './EditTaskPill.jsx'

function Row({ task, onClick, ...handlers }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={isDragging ? 'opacity-70' : ''}
    >
      <TaskItem task={task} {...handlers} />
    </div>
  )
}

function CategorySection({ id, label, children, showArrows, onMoveUp, onMoveDown, disableUp, disableDown }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={isOver ? 'ring-1 ring-[var(--color-accent)] rounded-xl p-1 -m-1 transition-colors' : 'transition-colors'}>
      <div className="text-xs uppercase tracking-wide opacity-60 mb-1 px-1 flex items-center gap-2">
        <span>{label}</span>
        {showArrows && (
          <span className="flex items-center gap-1 opacity-70">
            <button
              type="button"
              disabled={disableUp}
              onClick={onMoveUp}
              className="p-1 rounded hover:bg-[rgba(127,127,127,0.15)] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move category up"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
            <button
              type="button"
              disabled={disableDown}
              onClick={onMoveDown}
              className="p-1 rounded hover:bg-[rgba(127,127,127,0.15)] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move category down"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </span>
        )}
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

export default function TaskList({ date, tasks, setTasks, api, addTaskPill }) {
  const [dragging, setDragging] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [focusIndex, setFocusIndex] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [reorderCategoriesMode, setReorderCategoriesMode] = useState(false)
  const CATEGORY_ORDER_KEY = 'taskCategoryOrder'
  const [categoryOrder, setCategoryOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(CATEGORY_ORDER_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  })
  // Hover preview state
  const [expandedId, setExpandedId] = useState(null)
  const hoverTimerRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 500, tolerance: 5 } })
  )

  useEffect(() => { if (!selectionMode) setSelectedIds(new Set()) }, [selectionMode])

  // Clear any pending hover timers on unmount
  useEffect(() => () => clearTimeout(hoverTimerRef.current), [])

  const startHoverTimer = (taskId) => {
    if (dragging || editingId) return
    clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setExpandedId(taskId)
    }, 2000) // 2s hover delay (was 3s)
  }
  const cancelHoverTimer = (taskId) => {
    clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = null
    if (expandedId === taskId) setExpandedId(null)
  }

  // Close preview when dragging starts
  useEffect(() => { if (dragging) { clearTimeout(hoverTimerRef.current); setExpandedId(null) } }, [dragging])

  const toggleSelect = (t) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(t._id)) next.delete(t._id); else next.add(t._id)
      return next
    })
  }

  const allSelected = selectedIds.size && selectedIds.size === tasks.length
  const anySelected = selectedIds.size > 0

  // Keyboard navigation + escape to close preview
  useEffect(() => {
    const onKey = async (e) => {
      if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowDown') { setFocusIndex(i => Math.min(i + 1, Math.max(tasks.length - 1, 0))); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setFocusIndex(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key && e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const t = tasks[focusIndex]; if (!t) return; const next = tasks.map(x => x._id === t._id ? { ...x, done: !x.done } : x); setTasks(next); await api.update(t._id, { done: !t.done }); e.preventDefault();
      }
      if (e.key && e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const t = tasks[focusIndex]; if (!t) return; setEditingId(t._id); setExpandedId(null); e.preventDefault();
      }
      if (e.key === 'Delete') {
        const t = tasks[focusIndex]; if (!t) return; setTasks(tasks.filter(x => x._id !== t._id)); await api.remove(t._id); e.preventDefault();
      }
      if (e.key === 'Escape') {
        if (editingId) { setEditingId(null); e.preventDefault(); return }
        if (expandedId) { setExpandedId(null); e.preventDefault(); }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tasks, focusIndex, editingId, expandedId])

  const onDragEnd = async ({ active, over }) => {
    setDragging(false)
    if (!over) return

    // If dropped over a category container (id starts with cat:)
    const activeId = active.id
    const overId = over.id
    const activeIdx = tasks.findIndex(t => t._id === activeId)
    if (activeIdx === -1) return
    const activeTask = tasks[activeIdx]

  const getCategory = (task) => (Array.isArray(task.labels) && task.labels.length ? task.labels[0].toUpperCase() : '_uncategorized')
    const currentCat = getCategory(activeTask)

    let targetCat = currentCat
    let reorderPerformed = false

    if (typeof overId === 'string' && overId.startsWith('cat:')) {
      targetCat = overId.slice(4)
      if (targetCat === '_general') targetCat = '_uncategorized'
    } else if (typeof overId === 'string') {
      // Over another task -> adopt that task's category
      const overTask = tasks.find(t => t._id === overId)
      if (overTask) targetCat = getCategory(overTask)
    }

    // Reorder when over another task id inside same category
    if (!overId.startsWith('cat:') && overId !== activeId) {
      const overIdx = tasks.findIndex(t => t._id === overId)
      if (overIdx !== -1) {
        const next = arrayMove(tasks, activeIdx, overIdx)
        setTasks(next)
        reorderPerformed = true
        try { await api.reorder({ ids: next.map(t => t._id) }) } catch {}
      }
    }

    // Category change
    if (targetCat !== currentCat) {
      const nextTasks = [...tasks]
      // Remove from current position first (if not already moved)
      const taskRemoved = reorderPerformed ? tasks.find(t => t._id === activeId) : nextTasks.splice(activeIdx, 1)[0]

      // Update labels: set/replace first label or clear for uncategorized
      let newLabels = Array.isArray(taskRemoved.labels) ? [...taskRemoved.labels] : []
      if (targetCat === '_uncategorized') {
        if (newLabels.length) newLabels = newLabels.slice(1) // drop first
      } else {
  if (!newLabels.length) newLabels = [targetCat.toUpperCase()]
  else newLabels[0] = targetCat.toUpperCase()
      }
      const updatedTask = { ...taskRemoved, labels: newLabels }

      // Insert at end of target category section
      const insertionIndex = (() => {
        if (targetCat === '_uncategorized') {
          // After last uncategorized task
            let lastIdx = -1
            nextTasks.forEach((t,i) => { const c = getCategory(t); if (c === '_uncategorized') lastIdx = i })
            return lastIdx === -1 ? 0 : lastIdx + 1
        } else {
          let lastIdx = -1
          nextTasks.forEach((t,i) => { if (getCategory(t) === targetCat) lastIdx = i })
          return lastIdx === -1 ? nextTasks.length : lastIdx + 1
        }
      })()
      if (!reorderPerformed) nextTasks.splice(insertionIndex, 0, updatedTask)
      else {
        // if reorder already moved its position, just update copy inside array
        const idxNow = nextTasks.findIndex(t => t._id === activeId)
        if (idxNow !== -1) nextTasks[idxNow] = updatedTask
      }
      setTasks(nextTasks)
      try { await api.update(activeTask._id, { labels: updatedTask.labels }) } catch {}
    }
  }

  const recurrenceLabel = (t) => {
    const r = t.recurrence
    if (!r) return 'Daily'
    if (r.type === 'weekly') return 'Weekly' + (r.daysOfWeek?.length ? ` (${r.daysOfWeek.map(d=>['S','M','T','W','T','F','S'][d]).join('')})` : '')
    if (r.type === 'monthly') return 'Monthly' + (r.dayOfMonth ? ` (day ${r.dayOfMonth})` : '')
    if (r.type === 'yearly') return 'Yearly'
    if (r.type === 'one-time') return 'One-time'
    return 'Daily'
  }

  const grouped = (() => {
    const map = new Map()
    tasks.forEach(t => {
  const cat = Array.isArray(t.labels) && t.labels.length ? t.labels[0].toUpperCase() : '_uncategorized'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(t)
    })
    return Array.from(map.entries())
  })()
  const categories = Array.from(new Set(tasks.map(t => (Array.isArray(t.labels) && t.labels.length ? t.labels[0].toUpperCase() : null)))).filter(Boolean)

  // Ensure categoryOrder contains all categories (excluding uncategorized sentinel)
  useEffect(() => {
    setCategoryOrder(prev => {
      let changed = false
      const next = [...prev]
      categories.forEach(c => { if (!next.includes(c)) { next.push(c); changed = true } })
      // Remove categories no longer present
      const filtered = next.filter(c => categories.includes(c))
      if (filtered.length !== next.length) changed = true
      return changed ? filtered : prev
    })
  }, [categories])

  // Persist
  useEffect(() => {
    try { localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(categoryOrder)) } catch {}
  }, [categoryOrder])

  const moveCat = (cat, dir) => {
    setCategoryOrder(order => {
      const idx = order.indexOf(cat)
      if (idx === -1) return order
      const target = idx + dir
      if (target < 0 || target >= order.length) return order
      const next = [...order]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // Build ordered grouped array: uncategorized first (GENERAL), then by categoryOrder, then any stragglers alphabetically
  const orderedGrouped = (() => {
    const map = new Map(grouped)
    const result = []
    if (map.has('_uncategorized')) result.push(['_uncategorized', map.get('_uncategorized')])
    categoryOrder.forEach(c => { if (map.has(c)) result.push([c, map.get(c)]) })
    // Any categories not in order (should be none) appended alphabetically
    const remaining = Array.from(map.keys()).filter(k => k !== '_uncategorized' && !categoryOrder.includes(k)).sort((a,b)=>a.localeCompare(b))
    remaining.forEach(k => result.push([k, map.get(k)]))
    return result
  })()

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
      {/* Bulk actions toolbar */}
      {(() => {
        const addOpen = !!(addTaskPill && addTaskPill.props && addTaskPill.props.open)
        return (
          <div className="mb-3">
            {addTaskPill && addOpen && (
              <div className="mb-3">{addTaskPill}</div>
            )}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {addTaskPill && !addOpen && (
                  <div className="inline-flex items-center">{addTaskPill}</div>
                )}
                <button className="ui-button" onClick={() => setSelectionMode(s => !s)}>{selectionMode ? 'Done' : 'Select'}</button>
                <button className={`ui-button ${reorderCategoriesMode ? 'accent' : ''}`} onClick={() => setReorderCategoriesMode(m => !m)}>
                  {reorderCategoriesMode ? 'Finish Reorder' : 'Reorder Categories'}
                </button>
                {selectionMode && (
                  <>
                    <button className="ui-button" onClick={() => setSelectedIds(new Set(tasks.map(t => t._id)))} disabled={allSelected}>Select All</button>
                    <button className="ui-button" onClick={() => setSelectedIds(new Set())} disabled={!anySelected}>Clear</button>
                  </>
                )}
              </div>
              {selectionMode && anySelected && (
                <div className="flex items-center gap-2">
                  <button className="ui-button" onClick={async () => {
                    const toToggle = tasks.filter(t => selectedIds.has(t._id) && !t.done)
                    const next = tasks.map(t => selectedIds.has(t._id) ? { ...t, done: true } : t)
                    setTasks(next)
                    await Promise.all(toToggle.map(t => api.update(t._id, { done: true })))
                    setSelectedIds(new Set())
                  }}>Complete</button>
                  <button className="ui-button danger" onClick={async () => {
                    const ids = Array.from(selectedIds)
                    setTasks(tasks.filter(t => !selectedIds.has(t._id)))
                    await Promise.all(ids.map(id => api.remove(id)))
                    setSelectedIds(new Set())
                  }}>Delete</button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {orderedGrouped.map(([cat, list], idx) => {
            const movable = cat !== '_uncategorized'
            const catsInOrder = orderedGrouped.filter(([c]) => c !== '_uncategorized').map(([c]) => c)
            const visibleIndex = movable ? catsInOrder.indexOf(cat) : -1
            const lastIndex = catsInOrder.length - 1
            return (
            <CategorySection
              key={cat}
              id={`cat:${cat === '_uncategorized' ? '_general' : cat}`}
              label={cat === '_uncategorized' ? 'GENERAL' : `#${cat}`}
              showArrows={reorderCategoriesMode && movable}
              disableUp={visibleIndex <= 0}
              disableDown={visibleIndex === -1 || visibleIndex >= lastIndex}
              onMoveUp={() => moveCat(cat, -1)}
              onMoveDown={() => moveCat(cat, 1)}
            >
              {list.map(t => {
                const globalIdx = tasks.findIndex(x => x._id === t._id)
                return (
                  <div key={t._id} onMouseEnter={() => startHoverTimer(t._id)} onMouseLeave={() => cancelHoverTimer(t._id)}>
                    <Row
                      task={t}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(t._id)}
                      onSelectToggle={toggleSelect}
                      isFocused={globalIdx === focusIndex}
                      onClick={() => setFocusIndex(globalIdx)}
                      onToggle={async (task) => {
                        const next = tasks.map(x => x._id === task._id ? { ...x, done: !x.done } : x)
                        setTasks(next)
                        await api.update(task._id, { done: !task.done, forDate: date })
                      }}
                      onDelete={async (task) => {
                        setTasks(tasks.filter(x => x._id !== task._id))
                        await api.remove(task._id)
                      }}
                      onEdit={(task) => { setEditingId(p => p === task._id ? null : task._id); setExpandedId(null); }}
                    />
                    <div className={`task-preview-wrapper ${expandedId === t._id && editingId !== t._id ? 'open' : ''}`}>
                      <div className="task-preview-pill">
                        <div className="flex flex-wrap items-center gap-2 text-xs opacity-75 mb-1">
                          <span>{recurrenceLabel(t)}</span>
                          {t.priority && <span className="px-2 py-0.5 rounded-full border" style={{ borderColor:'var(--border-hairline)' }}>{String(t.priority).toUpperCase()}</span>}
                          {t.dueAt && <span>Due {new Date(t.dueAt).toLocaleDateString()}</span>}
                          {Array.isArray(t.labels) && t.labels.map(l => (
                            <span key={l} className="px-2 py-0.5 rounded-full border" style={{ borderColor:'var(--border-hairline)' }}>#{l}</span>
                          ))}
                        </div>
                        {t.description && <div className="text-sm leading-snug whitespace-pre-wrap opacity-90">{t.description}</div>}
                      </div>
                    </div>
                    {editingId === t._id && (
                      <EditTaskPill
                        task={t}
                        categories={categories}
                        onCancel={() => setEditingId(null)}
                        onSave={async (patch) => {
                          const updated = await api.update(t._id, patch)
                          setTasks(tasks.map(x => x._id === t._id ? updated : x))
                          setEditingId(null)
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </CategorySection>
          )})}
        </div>
      </SortableContext>
    </DndContext>
  )
}
