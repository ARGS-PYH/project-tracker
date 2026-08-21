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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 56, height: 56, background: 'var(--brand-light)', color: 'var(--brand-text)', border: '1px solid var(--brand-border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: 24 }}>
          🔒
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{project.name}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select your name & enter PIN to enter</p>

        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', borderRadius: 8, fontSize: 12, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Select Member</label>
            <select 
              value={selectedMemberId} 
              onChange={e => { setSelectedMemberId(e.target.value); setError(''); setPin(''); setNewPin(''); setConfirmPin(''); }}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: 14, outline: 'none' }}
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Create PIN</label>
                <input 
                  type="password"
                  placeholder="4-8 digits"
                  maxLength={8}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Confirm PIN</label>
                <input 
                  type="password"
                  placeholder="Confirm PIN"
                  maxLength={8}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Enter Your PIN</label>
              <input 
                type="password"
                placeholder="••••"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 18, textAlign: 'center', letterSpacing: '0.3em', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }}
                autoFocus
              />
            </div>
          )}

          <button 
            onClick={handleUnlock}
            style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 4, cursor: 'pointer' }}
          >
            {isFirstTime ? 'Set PIN & Enter Workspace' : 'Unlock Workspace'}
          </button>

          {!isFirstTime && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-sub)', textAlign: 'center', lineHeight: 1.4 }}>
              💡 Forgot your PIN? Ask project admin <strong>({project.members?.find(m => m.isAdmin)?.name || 'Admin'})</strong> to look up or reset your PIN.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
