import { useState } from 'react'

export default function AddTaskModal({ sharedTasks, members, user, onAddTask, onClose }) {
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState(sharedTasks[0]?.id || '')
  const [assignedTo, setAssignedTo] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('Please select an image under 3MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target.result)
      setImagePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    const selectedMember = members.find(m => m.name === assignedTo)
    
    onAddTask({
      groupId: groupId || sharedTasks[0]?.id,
      text: title.trim(),
      assignedTo: assignedTo || null,
      assignedEmail: selectedMember?.email || '',
      imageUrl: image || null
    })

    setSubmitting(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 460, background: 'var(--card-bg)',
        border: '1px solid var(--border)', borderRadius: 20, padding: 24,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            ➕ Add Standalone Task
          </h3>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Task Description *
            </label>
            <textarea
              rows={2}
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--input-bg)',
                color: 'var(--text-main)', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Phase / Group
              </label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--input-bg)',
                  color: 'var(--text-main)', fontSize: 12, outline: 'none'
                }}
              >
                {sharedTasks.map((g, idx) => (
                  <option key={g.id || idx} value={g.id}>
                    Phase {g.phase || 1}: {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Assign To (Optional)
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--input-bg)',
                  color: 'var(--text-main)', fontSize: 12, outline: 'none'
                }}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id || m.name} value={m.name}>
                    👤 {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              Attach Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="taskImageInput"
              style={{ display: 'none' }}
            />
            <label
              htmlFor="taskImageInput"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8, border: '1px dashed var(--border)',
                background: 'var(--card-sub-bg)', color: 'var(--text-main)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              🖼️ {imagePreview ? 'Change Attached Image' : 'Choose Image File'}
            </label>

            {imagePreview && (
              <div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  style={{
                    position: 'absolute', top: -6, right: -6, background: '#EF4444',
                    color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20,
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-muted)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              style={{
                padding: '10px 20px', background: '#10B981', color: '#090D16',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }}
            >
              {submitting ? 'Creating...' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
