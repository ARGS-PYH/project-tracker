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
    <div style={{ background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 12, padding: '1.25rem', boxShadow: '0 4px 10px -8px rgba(36,33,29,0.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#24211D' }}>My Private Tasks</h3>
          <p style={{ fontSize: 12, color: '#746E64' }}>Only visible to you. Keep track of personal to-dos.</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#3F5F45', background: '#EEF3ED', padding: '3px 8px', borderRadius: 12 }}>
          {doneCount}/{privateTasks.length} done
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <input 
          type="text"
          placeholder="Add a private personal to-do..."
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
        />
        <button 
          onClick={addTask}
          style={{ padding: '9px 16px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
        >
          + Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {privateTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: 13 }}>
            No private tasks yet. Add one above!
          </div>
        ) : (
          privateTasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: t.done ? '#F7F5F0' : '#EFEAE1', borderRadius: 8 }}>
              <input 
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#5F7A61' }}
              />
              <span 
                onClick={() => toggleTask(t.id)}
                style={{ flex: 1, fontSize: 13, color: t.done ? '#9A9287' : '#24211D', textDecoration: t.done ? 'line-through' : 'none', cursor: 'pointer' }}
              >
                {t.text}
              </span>
              <button 
                onClick={() => deleteTask(t.id)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 14 }}
              >
                x
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
