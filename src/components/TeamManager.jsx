import { useState } from 'react'

export default function TeamManager({ project, onUpdateMembers, currentUser }) {
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPin, setNewMemberPin] = useState('')
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [editPinValue, setEditPinValue] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [showPins, setShowPins] = useState(true)
  const [error, setError] = useState('')

  const members = project.members || []

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleAddMember = (e) => {
    e.preventDefault()
    const trimmedName = newMemberName.trim()
    if (!trimmedName) return

    if (members.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('A member with this name already exists.')
      return
    }

    const assignedPin = newMemberPin.trim() || generateRandomPin()

    const newMember = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      pin: assignedPin,
      isAdmin: false
    }

    onUpdateMembers([...members, newMember])
    setNewMemberName('')
    setNewMemberPin('')
    setError('')
  }

  const handleSaveEditedPin = (memberId) => {
    if (!editPinValue.trim() || editPinValue.trim().length < 4) {
      setError('PIN must be at least 4 digits.')
      return
    }

    const updated = members.map(m => 
      m.id === memberId ? { ...m, pin: editPinValue.trim() } : m
    )

    onUpdateMembers(updated)
    setEditingMemberId(null)
    setEditPinValue('')
    setError('')
  }

  const handleDeleteMember = (memberId, memberName) => {
    if (memberId === currentUser?.id) {
      alert('You cannot remove yourself as Admin.')
      return
    }
    if (!window.confirm(`Remove "${memberName}" from the project team?`)) return

    const updated = members.filter(m => m.id !== memberId)
    onUpdateMembers(updated)
  }

  const handleCopyPin = (member) => {
    navigator.clipboard.writeText(`${member.name}'s PIN for ${project.name}: ${member.pin}`)
    setCopiedId(member.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Add Member Box */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              👥 Team & PIN Management
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Add new members, issue PINs, and retrieve or reset PINs if a member forgets theirs.
            </p>
          </div>

          <button 
            onClick={() => setShowPins(!showPins)}
            style={{ fontSize: 12, padding: '6px 14px', background: 'var(--brand-light)', color: 'var(--brand-text)', border: '1px solid var(--brand-border)', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
          >
            {showPins ? '🔒 Mask PINs' : '👁️ Reveal All PINs'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10 }}>
          <input 
            type="text"
            placeholder="New member name (e.g. Sarah)"
            value={newMemberName}
            onChange={e => { setNewMemberName(e.target.value); setError(''); }}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 14, outline: 'none' }}
          />

          <div style={{ display: 'flex', gap: 4 }}>
            <input 
              type="text"
              placeholder="PIN (4 digits)"
              maxLength={8}
              value={newMemberPin}
              onChange={e => setNewMemberPin(e.target.value)}
              style={{ width: '100%', padding: '10px 8px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 14, textAlign: 'center', outline: 'none' }}
            />
            <button 
              type="button"
              onClick={() => setNewMemberPin(generateRandomPin())}
              title="Generate random 4-digit PIN"
              style={{ padding: '0 10px', background: 'var(--brand-light)', color: 'var(--brand-text)', border: '1px solid var(--brand-border)', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              ⚡
            </button>
          </div>

          <button 
            type="submit"
            style={{ padding: '10px 18px', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Add Member
          </button>
        </form>
      </div>

      {/* Members List Table / Cards */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '14px 18px', background: 'var(--card-sub-bg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>Team Roster ({members.length} members)</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin Master Key</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((member, index) => {
            const isEditing = editingMemberId === member.id

            return (
              <div 
                key={member.id || index}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
                  borderBottom: index < members.length - 1 ? '1px solid var(--border)' : 'none',
                  flexWrap: 'wrap', gap: 12, background: member.isAdmin ? 'var(--brand-light)' : 'transparent'
                }}
              >
                {/* Member Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: member.isAdmin ? 'var(--primary)' : 'var(--border)', color: member.isAdmin ? 'var(--primary-text)' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {member.name}
                      {member.isAdmin && (
                        <span style={{ fontSize: 10, background: 'var(--brand-light)', color: 'var(--brand-text)', border: '1px solid var(--brand-border)', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                          ADMIN 👑
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>ID: {member.id}</div>
                  </div>
                </div>

                {/* PIN Info & Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input 
                        type="text"
                        placeholder="New PIN"
                        maxLength={8}
                        value={editPinValue}
                        onChange={e => setEditPinValue(e.target.value)}
                        style={{ width: 90, padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--primary)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 13, textAlign: 'center', outline: 'none' }}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEditedPin(member.id)}
                        style={{ padding: '6px 12px', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => { setEditingMemberId(null); setEditPinValue(''); }}
                        style={{ padding: '6px 8px', background: 'var(--card-sub-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        padding: '6px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--brand-text)', borderRadius: 8,
                        fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em'
                      }}>
                        {showPins ? (member.pin || 'No PIN') : '••••'}
                      </div>

                      <button 
                        onClick={() => handleCopyPin(member)}
                        title="Copy PIN to clipboard"
                        style={{ padding: '6px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: copiedId === member.id ? 'var(--brand-text)' : 'var(--text-main)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                      >
                        {copiedId === member.id ? '✓ Copied' : '📋 Copy'}
                      </button>

                      <button 
                        onClick={() => { setEditingMemberId(member.id); setEditPinValue(member.pin || ''); }}
                        title="Reset or Change PIN"
                        style={{ padding: '6px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--text-muted)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                      >
                        ✏️ Reset PIN
                      </button>
                    </div>
                  )}

                  {!member.isAdmin && (
                    <button 
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      title="Remove Member from Team"
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px 8px', fontSize: 14 }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
