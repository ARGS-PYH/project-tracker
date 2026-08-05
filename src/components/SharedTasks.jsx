import { useState } from 'react'

const G = '#2563EB'
const G_LITE = '#EFF6FF'
const pct = (done, total) => total === 0 ? 0 : Math.round((done / total) * 100)

function Bar({ done, total, height = 6 }) {
  const p = pct(done, total)
  return (
    <div style={{ height, borderRadius: height / 2, background: '#F1F5F9', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: height / 2, background: G, width: `${p}%`, transition: 'width 0.35s ease' }} />
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
            background: '#FFFFFF',
            border: `1px solid ${allDone ? '#10B981' : '#E2E8F0'}`,
            borderRadius: 12,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            {/* Group Header */}
            <div style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              background: allDone ? '#ECFDF5' : '#F8FAFC', borderBottom: '1px solid #E2E8F0'
            }}>
              {editMode ? (
                <select 
                  value={group.phase || 1} 
                  onChange={e => handleUpdateGroup(gi, 'phase', Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
                >
                  <option value={1}>Phase 1</option>
                  <option value={2}>Phase 2</option>
                  <option value={3}>Phase 3</option>
                </select>
              ) : (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em',
                  background: '#2563EB', color: '#fff'
                }}>Phase {group.phase || 1}</span>
              )}

              {editMode ? (
                <input 
                  value={group.title} 
                  onChange={e => handleUpdateGroup(gi, 'title', e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 600 }}
                />
              ) : (
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A', flex: 1 }}>{group.title}</span>
              )}

              {editMode ? (
                <button onClick={() => handleDeleteGroup(gi)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 14 }}>🗑️</button>
              ) : (
                <span style={{ fontSize: 12, color: allDone ? '#10B981' : '#64748B', fontWeight: allDone ? 700 : 500 }}>
                  {doneCount}/{items.length}
                </span>
              )}
            </div>

            {!editMode && items.length > 0 && (
              <div style={{ padding: '0 16px' }}><Bar done={doneCount} total={items.length} height={3} /></div>
            )}

            {/* Task Items */}
            {items.map((item, ii) => {
              const isChecked = !!checkedState[item.id]
              const meta = checkedState[`${item.id}__meta`]

              return (
                <div key={item.id || ii} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                  borderTop: '1px solid #F1F5F9', background: isChecked && !editMode ? '#F8FAFC' : 'transparent'
                }}>
                  {!editMode && (
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => onToggle(item.id)} 
                      style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }} 
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    {editMode ? (
                      <textarea 
                        value={item.text} 
                        onChange={e => handleUpdateTask(gi, ii, e.target.value)} 
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, minHeight: 36 }}
                      />
                    ) : (
                      <span 
                        onClick={() => onToggle(item.id)}
                        style={{ fontSize: 13, lineHeight: 1.5, color: isChecked ? '#94A3B8' : '#1E293B', textDecoration: isChecked ? 'line-through' : 'none', cursor: 'pointer' }}
                      >
                        {item.text}
                      </span>
                    )}
                    {isChecked && meta && !editMode && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>✓ {meta.by} · {meta.at}</div>
                    )}
                  </div>
                  {editMode && (
                    <button onClick={() => handleDeleteTask(gi, ii)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
                  )}
                </div>
              )
            })}

            {editMode && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9' }}>
                <button onClick={() => handleAddTask(gi)} style={{ fontSize: 12, color: '#2563EB', background: '#EFF6FF', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Add Task</button>
              </div>
            )}
          </div>
        )
      })}

      {editMode && (
        <button onClick={handleAddGroup} style={{ padding: '14px', border: '1.5px dashed #CBD5E1', borderRadius: 12, background: '#FFFFFF', color: '#64748B', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Add New Phase / Group
        </button>
      )}
    </div>
  )
}
