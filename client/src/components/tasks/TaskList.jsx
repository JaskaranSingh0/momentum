import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import TaskItem from './TaskItem.jsx'

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

export default function TaskList({ date, tasks, setTasks, api }) {
  const [dragging, setDragging] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [focusIndex, setFocusIndex] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 500, tolerance: 5 } })
  )

  useEffect(() => { if (!selectionMode) setSelectedIds(new Set()) }, [selectionMode])

  const toggleSelect = (t) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(t._id)) next.delete(t._id); else next.add(t._id)
      return next
    })
  }

  const allSelected = selectedIds.size && selectedIds.size === tasks.length
  const anySelected = selectedIds.size > 0

  // Keyboard navigation
  useEffect(() => {
    const onKey = async (e) => {
      if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowDown') { setFocusIndex(i => Math.min(i + 1, Math.max(tasks.length - 1, 0))); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setFocusIndex(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) {
        const t = tasks[focusIndex]; if (!t) return; const next = tasks.map(x => x._id === t._id ? { ...x, done: !x.done } : x); setTasks(next); await api.update(t._id, { done: !t.done }); e.preventDefault();
      }
      if (e.key === 'Delete') {
        const t = tasks[focusIndex]; if (!t) return; setTasks(tasks.filter(x => x._id !== t._id)); await api.remove(t._id); e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tasks, focusIndex])

  const onDragEnd = async ({ active, over }) => {
    setDragging(false)
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex(t => t._id === active.id)
    const newIndex = tasks.findIndex(t => t._id === over.id)
    const next = arrayMove(tasks, oldIndex, newIndex)
    setTasks(next)
    try {
      await api.reorder({ date, ids: next.map(t => t._id) })
    } catch {}
  }

  return (
  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
      {/* Bulk actions toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button className="ui-button" onClick={() => setSelectionMode(s => !s)}>{selectionMode ? 'Done' : 'Select'}</button>
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

      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((t, idx) => (
            <Row
              key={t._id}
              task={t}
              selectionMode={selectionMode}
              selected={selectedIds.has(t._id)}
              onSelectToggle={toggleSelect}
              isFocused={idx === focusIndex}
              onClick={() => setFocusIndex(idx)}
              onToggle={async (task) => {
                const next = tasks.map(x => x._id === task._id ? { ...x, done: !x.done } : x)
                setTasks(next)
                await api.update(task._id, { done: !task.done })
              }}
              onRename={async (task, text) => {
                const next = tasks.map(x => x._id === task._id ? { ...x, text } : x)
                setTasks(next)
                await api.update(task._id, { text })
              }}
              onDelete={async (task) => {
                setTasks(tasks.filter(x => x._id !== task._id))
                await api.remove(task._id)
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
