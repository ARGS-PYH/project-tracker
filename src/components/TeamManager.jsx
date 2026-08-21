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
      <div style={{ background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 12px -8px rgba(36,33,29,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#24211D', display: 'flex', alignItems: 'center', gap: 8 }}>
              👥 Team & PIN Management
            </h3>
            <p style={{ fontSize: 13, color: '#746E64', marginTop: 2 }}>
              Add new members, issue PINs, and retrieve or reset PINs if a member forgets theirs.
            </p>
          </div>

          <button 
            onClick={() => setShowPins(!showPins)}
            style={{ fontSize: 12, padding: '6px 12px', background: '#EEF3ED', color: '#3F5F45', border: '1px solid #D4DEC9', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
          >
            {showPins ? '🔒 Mask PINs' : '👁️ Reveal All PINs'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem' }}>
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
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, background: '#FFFDF8', outline: 'none' }}
          />

          <div style={{ display: 'flex', gap: 4 }}>
            <input 
              type="text"
              placeholder="PIN (4 digits)"
              maxLength={8}
              value={newMemberPin}
              onChange={e => setNewMemberPin(e.target.value)}
              style={{ width: '100%', padding: '10px 8px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, textAlign: 'center', background: '#FFFDF8' }}
            />
            <button 
              type="button"
              onClick={() => setNewMemberPin(generateRandomPin())}
              title="Generate random 4-digit PIN"
              style={{ padding: '0 8px', background: '#EEF3ED', color: '#3F5F45', border: '1px solid #D4DEC9', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              ⚡
            </button>
          </div>

          <button 
            type="submit"
            style={{ padding: '10px 18px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Add Member
          </button>
        </form>
      </div>

      {/* Members List Table / Cards */}
      <div style={{ background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px -8px rgba(36,33,29,0.1)' }}>
        <div style={{ padding: '14px 18px', background: '#F7F5F0', borderBottom: '1px solid #DED8CD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#24211D' }}>Team Roster ({members.length} members)</span>
          <span style={{ fontSize: 12, color: '#746E64' }}>Admin Master Key</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((member, index) => {
            const isEditing = editingMemberId === member.id

            return (
              <div 
                key={member.id || index}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
                  borderBottom: index < members.length - 1 ? '1px solid #EFEAE1' : 'none',
                  flexWrap: 'wrap', gap: 12, background: member.isAdmin ? '#FAF8F3' : 'transparent'
                }}
              >
                {/* Member Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: member.isAdmin ? '#5F7A61' : '#EEF3ED', color: member.isAdmin ? '#fff' : '#3F5F45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#24211D', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {member.name}
                      {member.isAdmin && (
                        <span style={{ fontSize: 10, background: '#E0EADF', color: '#2F4F35', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                          ADMIN 👑
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>ID: {member.id}</div>
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
                        style={{ width: 90, padding: '6px 8px', borderRadius: 6, border: '1.5px solid #5F7A61', fontSize: 13, textAlign: 'center', outline: 'none' }}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEditedPin(member.id)}
                        style={{ padding: '6px 10px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => { setEditingMemberId(null); setEditPinValue(''); }}
                        style={{ padding: '6px 8px', background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        padding: '6px 12px', background: '#EEF3ED', color: '#2F4F35', borderRadius: 8,
                        fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em'
                      }}>
                        {showPins ? (member.pin || 'No PIN') : '••••'}
                      </div>

                      <button 
                        onClick={() => handleCopyPin(member)}
                        title="Copy PIN to clipboard"
                        style={{ padding: '6px 10px', background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: copiedId === member.id ? '#059669' : '#3F5F45', fontWeight: 500 }}
                      >
                        {copiedId === member.id ? '✓ Copied' : '📋 Copy'}
                      </button>

                      <button 
                        onClick={() => { setEditingMemberId(member.id); setEditPinValue(member.pin || ''); }}
                        title="Reset or Change PIN"
                        style={{ padding: '6px 10px', background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#746E64', fontWeight: 500 }}
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
