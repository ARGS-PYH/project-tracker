import { useState } from 'react'
import TaskComments from './TaskComments.jsx'
import AddTaskModal from './AddTaskModal.jsx'

const pct = (done, total) => total === 0 ? 0 : Math.round((done / total) * 100)

function Bar({ done, total, height = 6 }) {
  const p = pct(done, total)
  return (
    <div style={{ height, borderRadius: height / 2, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: height / 2, background: 'var(--primary)', width: `${p}%`, transition: 'width 0.35s ease' }} />
    </div>
  )
}

function AssignButton({ gi, ii, teamMembers, onAssign }) {
  const [open, setOpen] = useState(false)

  if (!teamMembers || teamMembers.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Assign task"
        style={{
          fontSize: 11, padding: '3px 9px', borderRadius: 6,
          border: '1px solid var(--border)', background: 'var(--card-bg)',
          color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600
        }}
      >
        📌 Assign
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100,
          minWidth: 160, overflow: 'hidden'
        }}>
          {teamMembers.map(m => (
            <button
              key={m.id || m.name}
              onClick={() => { onAssign(gi, ii, m.name, m.email); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '8px 12px',
                fontSize: 12, border: 'none', background: 'transparent',
                color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', fontWeight: 500
              }}
              onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              👤 {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SharedTasks({ sharedTasks, checkedState, onToggle, user, editMode, onSaveTasks, members = [], projectName = '' }) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [activeTaskImageModal, setActiveTaskImageModal] = useState(null)

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

  const handleCreateStandaloneTask = ({ groupId, text, assignedTo, assignedEmail, imageUrl }) => {
    const updated = [...sharedTasks]
    let gi = updated.findIndex(g => g.id === groupId)
    if (gi === -1) gi = 0

    if (!updated[gi]) return

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text,
      assignedTo: assignedTo || null,
      assignedAt: assignedTo ? new Date().toISOString() : null,
      assignedBy: assignedTo ? user?.name : null,
      imageUrl: imageUrl || null
    }

    updated[gi].items = [...(updated[gi].items || []), newTask]
    onSaveTasks(updated)

    if (assignedTo) {
      const groupTitle = updated[gi]?.title || 'Task Group'
      const apiBase = import.meta.env.VITE_API_URL || ''
      const endpoint = `${apiBase}/api/notify/assign`

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeName: assignedTo,
          assigneeEmail: assignedEmail || '',
          taskText: text,
          groupTitle,
          assignedBy: user?.name || 'Team Member',
          projectName
        })
      }).catch(err => console.warn('Email notification failed:', err))
    }
  }

  const handleUpdateTask = (gi, ii, field, value) => {
    const updated = [...sharedTasks]
    if (typeof field === 'string') {
      updated[gi].items[ii][field] = value
    } else {
      updated[gi].items[ii].text = field
    }
    onSaveTasks(updated)
  }

  const handleTaskImageUpload = (gi, ii, file) => {
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('Please select an image under 3MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      handleUpdateTask(gi, ii, 'imageUrl', e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleAssignTask = (gi, ii, assigneeName, assigneeEmail = '') => {
    const updated = [...sharedTasks]
    const task = updated[gi].items[ii]
    updated[gi].items[ii] = {
      ...task,
      assignedTo: assigneeName || null,
      assignedAt: assigneeName ? new Date().toISOString() : null,
      assignedBy: assigneeName ? user?.name : null
    }
    onSaveTasks(updated)

    if (assigneeName) {
      const groupTitle = updated[gi]?.title || 'Task Group'
      const apiBase = import.meta.env.VITE_API_URL || ''
      const endpoint = `${apiBase}/api/notify/assign`

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeName,
          assigneeEmail,
          taskText: task.text,
          groupTitle,
          assignedBy: user?.name || 'Team Member',
          projectName
        })
      }).catch(err => console.warn('Email notification failed:', err))
    }
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
      {/* Standalone Add Task Button Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '12px 18px', boxShadow: 'var(--shadow)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📋 Tasks Overview
        </div>
        <button
          onClick={() => setShowAddTaskModal(true)}
          style={{
            padding: '8px 16px', background: '#10B981', color: '#090D16',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          ➕ Add Task
        </button>
      </div>

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
                <span style={{ fontSize: 12, color: allDone ? 'var(--brand-text)' : 'var(--text-muted)', fontWeight: 700 }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <textarea 
                          value={item.text} 
                          onChange={e => handleUpdateTask(gi, ii, 'text', e.target.value)} 
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 13, minHeight: 36, outline: 'none' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="file"
                            accept="image/*"
                            id={`taskImage_${gi}_${ii}`}
                            onChange={e => handleTaskImageUpload(gi, ii, e.target.files?.[0])}
                            style={{ display: 'none' }}
                          />
                          <label
                            htmlFor={`taskImage_${gi}_${ii}`}
                            style={{ fontSize: 11, color: 'var(--brand-text)', cursor: 'pointer', background: 'var(--brand-light)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--brand-border)', fontWeight: 600 }}
                          >
                            🖼️ {item.imageUrl ? 'Change Image' : 'Attach Image'}
                          </label>
                          {item.imageUrl && (
                            <button
                              onClick={() => handleUpdateTask(gi, ii, 'imageUrl', null)}
                              style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Remove Image
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span 
                        onClick={() => onToggle(item.id)}
                        style={{ fontSize: 14, lineHeight: 1.5, color: isChecked ? 'var(--text-sub)' : 'var(--text-main)', textDecoration: isChecked ? 'line-through' : 'none', cursor: 'pointer' }}
                      >
                        {item.text}
                      </span>
                    )}

                    {/* Attached Task Image Preview */}
                    {item.imageUrl && !editMode && (
                      <div style={{ marginTop: 6 }}>
                        <img
                          src={item.imageUrl}
                          alt="Task attachment"
                          onClick={() => setActiveTaskImageModal(item.imageUrl)}
                          style={{
                            maxHeight: 140, maxWidth: '100%', borderRadius: 8,
                            border: '1px solid var(--border)', cursor: 'pointer',
                            objectFit: 'cover', marginTop: 4
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Assignment Badge */}
                    {item.assignedTo && !editMode && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 12,
                          background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
                          whiteSpace: 'nowrap'
                        }}>
                          👤 {item.assignedTo}
                        </span>
                      </div>
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
                  
                  {/* Assign dropdown (edit mode) */}
                  {editMode && (
                    <select
                      value={item.assignedTo || ''}
                      onChange={e => {
                        const m = members.find(mem => mem.name === e.target.value)
                        handleAssignTask(gi, ii, e.target.value || null, m?.email || '')
                      }}
                      style={{
                        fontSize: 11, padding: '4px 8px', borderRadius: 6,
                        border: '1px solid var(--border)', background: item.assignedTo ? '#EEF2FF' : 'var(--input-bg)',
                        color: item.assignedTo ? '#4F46E5' : 'var(--text-muted)', cursor: 'pointer',
                        maxWidth: 130
                      }}
                    >
                      <option value="">Assign to...</option>
                      {members.map(m => (
                        <option key={m.id || m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Quick Assign button (view mode) */}
                  {!editMode && !item.assignedTo && (
                    <AssignButton
                      gi={gi}
                      ii={ii}
                      teamMembers={members}
                      onAssign={(gIdx, iIdx, name, email) => handleAssignTask(gIdx, iIdx, name, email)}
                    />
                  )}

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

      {/* Standalone Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal
          sharedTasks={sharedTasks}
          members={members}
          user={user}
          onAddTask={handleCreateStandaloneTask}
          onClose={() => setShowAddTaskModal(false)}
        />
      )}

      {/* Image Lightbox Modal */}
      {activeTaskImageModal && (
        <div
          onClick={() => setActiveTaskImageModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <img
            src={activeTaskImageModal}
            alt="Full size task attachment"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
