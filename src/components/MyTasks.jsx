import { useState } from 'react'

export default function MyTasks({ privateTasks, onSavePrivateTasks }) {
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

  const doneCount = privateTasks.filter(t => t.done).length

  return (
    <div style={{ background: '#111827', border: '1px solid #1F293D', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>🔒 My Private Tasks</h3>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>Only visible to you. Keep track of your personal to-dos.</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: 12 }}>
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
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #1F293D', background: '#0D131F', color: '#F9FAFB', fontSize: 14, outline: 'none' }}
        />
        <button 
          onClick={addTask}
          style={{ padding: '10px 18px', background: '#10B981', color: '#090D16', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {privateTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280', fontSize: 13 }}>
            No private tasks yet. Add one above!
          </div>
        ) : (
          privateTasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: t.done ? 'rgba(17, 24, 39, 0.4)' : '#0D131F', border: '1px solid #1F293D', borderRadius: 10 }}>
              <input 
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#10B981' }}
              />
              <span 
                onClick={() => toggleTask(t.id)}
                style={{ flex: 1, fontSize: 14, color: t.done ? '#6B7280' : '#E5E7EB', textDecoration: t.done ? 'line-through' : 'none', cursor: 'pointer' }}
              >
                {t.text}
              </span>
              <button 
                onClick={() => deleteTask(t.id)}
                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
