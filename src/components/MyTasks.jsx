import { useState } from 'react'
import TaskComments from './TaskComments.jsx'

export default function MyTasks({ privateTasks, user, onSavePrivateTasks }) {
  const [taskInput, setTaskInput] = useState('')

  const addTask = () => {
    const text = taskInput.trim()
    if (!text) return
    const newTask = {
      id: `ptask_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text,
      done: false,
      createdAt: new Date().toISOString()
    }
    onSavePrivateTasks([newTask, ...privateTasks])
    setTaskInput('')
  }

  const toggleTask = (id) => {
    const updated = privateTasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    onSavePrivateTasks(updated)
  }

  const deleteTask = (id) => {
    const updated = privateTasks.filter(t => t.id !== id)
    onSavePrivateTasks(updated)
  }

  const addComment = (id, comment) => {
    const updated = privateTasks.map(t => (
      t.id === id ? { ...t, comments: [...(t.comments || []), comment] } : t
    ))
    onSavePrivateTasks(updated)
  }

  const doneCount = privateTasks.filter(t => t.done).length

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>🔒 My Private Tasks</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Only visible to you. Keep track of your personal to-dos.</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-text)', background: 'var(--brand-light)', border: '1px solid var(--brand-border)', padding: '3px 10px', borderRadius: 12 }}>
          {doneCount}/{privateTasks.length} done
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        <input 
          type="text"
          placeholder="Add a private personal to-do..."
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 14, outline: 'none' }}
        />
        <button 
          onClick={addTask}
          style={{ padding: '10px 18px', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {privateTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-sub)', fontSize: 13 }}>
            No private tasks yet. Add one above!
          </div>
        ) : (
          privateTasks.map(t => (
            <div key={t.id} style={{ padding: '10px 14px', background: t.done ? 'var(--card-sub-bg)' : 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input 
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span 
                  onClick={() => toggleTask(t.id)}
                  style={{ flex: 1, fontSize: 14, color: t.done ? 'var(--text-sub)' : 'var(--text-main)', textDecoration: t.done ? 'line-through' : 'none', cursor: 'pointer' }}
                >
                  {t.text}
                </span>
                <button 
                  onClick={() => deleteTask(t.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
              <TaskComments
                comments={t.comments || []}
                user={user}
                onAddComment={(comment) => addComment(t.id, comment)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
