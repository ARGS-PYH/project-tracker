import { useState } from 'react'
import TaskComments from './TaskComments.jsx'

const pct = (done, total) => total === 0 ? 0 : Math.round((done / total) * 100)

function Bar({ done, total, height = 6 }) {
  const p = pct(done, total)
  return (
    <div style={{ height, borderRadius: height / 2, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: height / 2, background: 'var(--primary)', width: `${p}%`, transition: 'width 0.35s ease' }} />
    </div>
  )
}

export default function SharedTasks({ sharedTasks, checkedState, onToggle, user, editMode, onSaveTasks }) {
  const handleUpdateGroup = (gi, field, value) => {
    const updated = [...sharedTasks]
    updated[gi] = { ...updated[gi], [field]: value }
    onSaveTasks(updated)
  }

  const handleDeleteGroup = (gi) => {
    if (!window.confirm('Delete this phase/group?')) return
    const updated = [...sharedTasks]
    updated.splice(gi, 1)
    onSaveTasks(updated)
  }

  const handleAddTask = (gi) => {
    const updated = [...sharedTasks]
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: 'New Task'
    }
    updated[gi].items = [...(updated[gi].items || []), newTask]
    onSaveTasks(updated)
  }

  const handleUpdateTask = (gi, ii, text) => {
    const updated = [...sharedTasks]
    updated[gi].items[ii].text = text
    onSaveTasks(updated)
  }

  const handleDeleteTask = (gi, ii) => {
    const updated = [...sharedTasks]
    updated[gi].items.splice(ii, 1)
    onSaveTasks(updated)
  }

  const handleAddComment = (gi, ii, comment) => {
    const updated = [...sharedTasks]
    const task = updated[gi].items[ii]
    updated[gi].items[ii] = {
      ...task,
      comments: [...(task.comments || []), comment]
    }
    onSaveTasks(updated)
  }

  const handleAddGroup = () => {
    const newGroup = {
      id: `group_${Date.now()}`,
      phase: 1,
      title: 'New Phase / Group',
      items: []
    }
    onSaveTasks([...sharedTasks, newGroup])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sharedTasks.map((group, gi) => {
        const items = group.items || []
        const doneCount = items.filter(item => checkedState[item.id]).length
        const allDone = doneCount === items.length && items.length > 0

        return (
          <div key={group.id || gi} style={{
            background: 'var(--card-bg)',
            border: `1px solid ${allDone ? 'var(--brand-border)' : 'var(--border)'}`,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: 'var(--shadow)'
          }}>
            {/* Group Header */}
            <div style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
              background: allDone ? 'var(--brand-light)' : 'var(--card-sub-bg)', borderBottom: '1px solid var(--border)'
            }}>
              {editMode ? (
                <select 
                  value={group.phase || 1} 
                  onChange={e => handleUpdateGroup(gi, 'phase', Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 12 }}
                >
                  <option value={1}>Phase 1</option>
                  <option value={2}>Phase 2</option>
                  <option value={3}>Phase 3</option>
                </select>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em',
                  background: 'var(--brand-light)', color: 'var(--brand-text)', border: '1px solid var(--brand-border)'
                }}>Phase {group.phase || 1}</span>
              )}

              {editMode ? (
                <input 
                  value={group.title} 
                  onChange={e => handleUpdateGroup(gi, 'title', e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}
                />
              ) : (
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-main)', flex: 1 }}>{group.title}</span>
              )}

              {editMode ? (
                <button onClick={() => handleDeleteGroup(gi)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 14 }}>🗑️</button>
              ) : (
                <span style={{ fontSize: 12, color: allDone ? 'var(--brand-text)' : 'var(--text-muted)', fontWeight: allDone ? 700 : 500 }}>
                  {doneCount}/{items.length}
                </span>
              )}
            </div>

            {!editMode && items.length > 0 && (
              <div style={{ padding: '0 18px', background: 'var(--card-sub-bg)' }}><Bar done={doneCount} total={items.length} height={3} /></div>
            )}

            {/* Task Items */}
            {items.map((item, ii) => {
              const isChecked = !!checkedState[item.id]
              const meta = checkedState[`${item.id}__meta`]

              return (
                <div key={item.id || ii} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px',
                  borderTop: '1px solid var(--border)', background: isChecked && !editMode ? 'var(--brand-light)' : 'transparent'
                }}>
                  {!editMode && (
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => onToggle(item.id)} 
                      style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    {editMode ? (
                      <textarea 
                        value={item.text} 
                        onChange={e => handleUpdateTask(gi, ii, e.target.value)} 
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 13, minHeight: 36, outline: 'none' }}
                      />
                    ) : (
                      <span 
                        onClick={() => onToggle(item.id)}
                        style={{ fontSize: 14, lineHeight: 1.5, color: isChecked ? 'var(--text-sub)' : 'var(--text-main)', textDecoration: isChecked ? 'line-through' : 'none', cursor: 'pointer' }}
                      >
                        {item.text}
                      </span>
                    )}
                    {isChecked && meta && !editMode && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>✓ {meta.by} · {meta.at}</div>
                    )}
                    {!editMode && (
                      <TaskComments
                        comments={item.comments || []}
                        user={user}
                        onAddComment={(comment) => handleAddComment(gi, ii, comment)}
                      />
                    )}
                  </div>
                  {editMode && (
                    <button onClick={() => handleDeleteTask(gi, ii)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
                  )}
                </div>
              )
            })}

            {editMode && (
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', background: 'var(--card-sub-bg)' }}>
                <button onClick={() => handleAddTask(gi)} style={{ fontSize: 12, color: 'var(--brand-text)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Add Task</button>
              </div>
            )}
          </div>
        )
      })}

      {editMode && (
        <button onClick={handleAddGroup} style={{ padding: '14px', border: '1.5px dashed var(--border)', borderRadius: 14, background: 'var(--card-bg)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Add New Phase / Group
        </button>
      )}
    </div>
  )
}
