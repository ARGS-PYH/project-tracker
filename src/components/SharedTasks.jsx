import { useState } from 'react'

const G = '#10B981'
const pct = (done, total) => total === 0 ? 0 : Math.round((done / total) * 100)

function Bar({ done, total, height = 6 }) {
  const p = pct(done, total)
  return (
    <div style={{ height, borderRadius: height / 2, background: '#1F293D', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: height / 2, background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', width: `${p}%`, transition: 'width 0.35s ease' }} />
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
            background: '#111827',
            border: `1px solid ${allDone ? 'rgba(16, 185, 129, 0.4)' : '#1F293D'}`,
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {/* Group Header */}
            <div style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
              background: allDone ? 'rgba(16, 185, 129, 0.08)' : '#0D131F', borderBottom: '1px solid #1F293D'
            }}>
              {editMode ? (
                <select 
                  value={group.phase || 1} 
                  onChange={e => handleUpdateGroup(gi, 'phase', Number(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #1F293D', background: '#111827', color: '#F9FAFB', fontSize: 12 }}
                >
                  <option value={1}>Phase 1</option>
                  <option value={2}>Phase 2</option>
                  <option value={3}>Phase 3</option>
                </select>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em',
                  background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>Phase {group.phase || 1}</span>
              )}

              {editMode ? (
                <input 
                  value={group.title} 
                  onChange={e => handleUpdateGroup(gi, 'title', e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #1F293D', background: '#111827', color: '#F9FAFB', fontSize: 14, fontWeight: 600 }}
                />
              ) : (
                <span style={{ fontWeight: 600, fontSize: 15, color: '#F9FAFB', flex: 1 }}>{group.title}</span>
              )}

              {editMode ? (
                <button onClick={() => handleDeleteGroup(gi)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 14 }}>🗑️</button>
              ) : (
                <span style={{ fontSize: 12, color: allDone ? '#34D399' : '#9CA3AF', fontWeight: allDone ? 700 : 500 }}>
                  {doneCount}/{items.length}
                </span>
              )}
            </div>

            {!editMode && items.length > 0 && (
              <div style={{ padding: '0 18px', background: '#0D131F' }}><Bar done={doneCount} total={items.length} height={3} /></div>
            )}

            {/* Task Items */}
            {items.map((item, ii) => {
              const isChecked = !!checkedState[item.id]
              const meta = checkedState[`${item.id}__meta`]

              return (
                <div key={item.id || ii} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px',
                  borderTop: '1px solid #1F293D', background: isChecked && !editMode ? 'rgba(17, 24, 39, 0.5)' : 'transparent'
                }}>
                  {!editMode && (
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => onToggle(item.id)} 
                      style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', accentColor: '#10B981' }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    {editMode ? (
                      <textarea 
                        value={item.text} 
                        onChange={e => handleUpdateTask(gi, ii, e.target.value)} 
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #1F293D', background: '#0D131F', color: '#F9FAFB', fontSize: 13, minHeight: 36, outline: 'none' }}
                      />
                    ) : (
                      <span 
                        onClick={() => onToggle(item.id)}
                        style={{ fontSize: 14, lineHeight: 1.5, color: isChecked ? '#6B7280' : '#E5E7EB', textDecoration: isChecked ? 'line-through' : 'none', cursor: 'pointer' }}
                      >
                        {item.text}
                      </span>
                    )}
                    {isChecked && meta && !editMode && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>✓ {meta.by} · {meta.at}</div>
                    )}
                  </div>
                  {editMode && (
                    <button onClick={() => handleDeleteTask(gi, ii)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
                  )}
                </div>
              )
            })}

            {editMode && (
              <div style={{ padding: '10px 18px', borderTop: '1px solid #1F293D', background: '#0D131F' }}>
                <button onClick={() => handleAddTask(gi)} style={{ fontSize: 12, color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Add Task</button>
              </div>
            )}
          </div>
        )
      })}

      {editMode && (
        <button onClick={handleAddGroup} style={{ padding: '14px', border: '1.5px dashed #1F293D', borderRadius: 14, background: '#111827', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Add New Phase / Group
        </button>
      )}
    </div>
  )
}
