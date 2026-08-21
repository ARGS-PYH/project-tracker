import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase.js'

export default function PinGate({ project, onUnlock }) {
  const [selectedMemberId, setSelectedMemberId] = useState(project.members?.[0]?.id || '')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')

  const selectedMember = project.members?.find(m => m.id === selectedMemberId)
  const isFirstTime = selectedMember && !selectedMember.pin

  const handleUnlock = async () => {
    if (!selectedMember) return

    if (isFirstTime) {
      if (!newPin.trim() || newPin.length < 4) {
        setError('PIN must be at least 4 digits.')
        return
      }
      if (newPin !== confirmPin) {
        setError('PINs do not match.')
        return
      }

      // Save new PIN for this member
      const updatedMembers = project.members.map(m => 
        m.id === selectedMember.id ? { ...m, pin: newPin.trim() } : m
      )

      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'projects', project.id), { members: updatedMembers })
      } else {
        const local = JSON.parse(localStorage.getItem(`project_${project.id}`) || '{}')
        local.members = updatedMembers
        localStorage.setItem(`project_${project.id}`, JSON.stringify(local))
      }

      onUnlock({ ...selectedMember, pin: newPin.trim() })
    } else {
      if (selectedMember.pin === pin.trim()) {
        onUnlock(selectedMember)
      } else {
        setError('Incorrect PIN. Please try again.')
        setPin('')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#090D16' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#111827', border: '1px solid #1F293D', borderRadius: 20, padding: '2rem', textAlign: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: 24 }}>
          🔒
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', marginBottom: 4 }}>{project.name}</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: '1.5rem' }}>Select your name & enter PIN to enter</p>

        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', borderRadius: 8, fontSize: 12, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 4 }}>Select Member</label>
            <select 
              value={selectedMemberId} 
              onChange={e => { setSelectedMemberId(e.target.value); setError(''); setPin(''); setNewPin(''); setConfirmPin(''); }}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #1F293D', background: '#0D131F', color: '#F9FAFB', fontSize: 14, outline: 'none' }}
            >
              {project.members?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isAdmin ? '(Admin)' : ''} {!m.pin ? '(Set up PIN)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isFirstTime ? (
            <>
              <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', color: '#FCD34D', borderRadius: 8, fontSize: 12 }}>
                First time logging in. Choose a 4-8 digit PIN to protect your profile.
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 4 }}>Create PIN</label>
                <input 
                  type="password"
                  placeholder="4-8 digits"
                  maxLength={8}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #1F293D', fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', background: '#0D131F', color: '#F9FAFB', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 4 }}>Confirm PIN</label>
                <input 
                  type="password"
                  placeholder="Confirm PIN"
                  maxLength={8}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #1F293D', fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', background: '#0D131F', color: '#F9FAFB', outline: 'none' }}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 4 }}>Enter Your PIN</label>
              <input 
                type="password"
                placeholder="••••"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #1F293D', fontSize: 18, textAlign: 'center', letterSpacing: '0.3em', background: '#0D131F', color: '#F9FAFB', outline: 'none' }}
                autoFocus
              />
            </div>
          )}

          <button 
            onClick={handleUnlock}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#090D16', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 4, cursor: 'pointer' }}
          >
            {isFirstTime ? 'Set PIN & Enter Workspace' : 'Unlock Workspace'}
          </button>

          {!isFirstTime && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 1.4 }}>
              💡 Forgot your PIN? Ask project admin <strong>({project.members?.find(m => m.isAdmin)?.name || 'Admin'})</strong> to look up or reset your PIN.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
