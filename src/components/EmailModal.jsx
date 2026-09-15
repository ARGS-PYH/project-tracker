import { useState } from 'react'

export default function EmailModal({ user, onSaveEmail, onClose }) {
  const [email, setEmail] = useState(user?.email || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setSaving(true)
      await onSaveEmail(trimmed)
      onClose()
    } catch (err) {
      setError('Failed to save email. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'var(--card-bg)',
        border: '1px solid var(--border)', borderRadius: 20, padding: 28,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', textAlign: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 26
        }}>
          ✉️
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px' }}>
          Get Task Assignment Emails
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 20px' }}>
          Hi <strong>{user?.name}</strong>, please provide your email address so you get notified whenever a task is assigned to you.
        </p>

        {error && (
          <div style={{
            padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444', color: '#FCA5A5', borderRadius: 8,
            fontSize: 12, marginBottom: 14
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="e.g. yourname@gmail.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            required
            autoFocus
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'var(--input-bg)',
              color: 'var(--text-main)', fontSize: 14, outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', padding: '12px', background: '#10B981',
              color: '#090D16', border: 'none', borderRadius: 10,
              fontWeight: 800, fontSize: 14, cursor: 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Email & Enable Notifications'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 6
            }}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
