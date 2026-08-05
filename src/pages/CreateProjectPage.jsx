import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase.js'

export default function CreateProjectPage() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addMember = () => {
    const trimmed = memberInput.trim()
    if (!trimmed) return
    if (members.some(m => m.name.toLowerCase() === trimmed.toLowerCase()) || trimmed.toLowerCase() === adminName.trim().toLowerCase()) {
      setError('Member name already exists')
      return
    }
    setMembers([...members, { id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name: trimmed }])
    setMemberInput('')
    setError('')
  }

  const removeMember = (id) => {
    setMembers(members.filter(m => m.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!projectName.trim() || !deadline || !adminName.trim() || !adminPin.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const projectId = `prj_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`
      
      const adminMember = {
        id: `admin_${Date.now()}`,
        name: adminName.trim(),
        pin: adminPin.trim(),
        isAdmin: true
      }

      const formattedMembers = [
        adminMember,
        ...members.map(m => ({ id: m.id, name: m.name, pin: null, isAdmin: false }))
      ]

      const initialSharedTasks = [
        {
          id: `group_phase_1`,
          phase: 1,
          title: "Phase 1: Foundation & Setup",
          items: [
            { id: `task_1_1`, text: "Define project scope and deliverables" },
            { id: `task_1_2`, text: "Team alignment and setup meeting" }
          ]
        }
      ]

      const projectData = {
        id: projectId,
        name: projectName.trim(),
        deadline,
        createdAt: serverTimestamp(),
        members: formattedMembers,
        sharedTasks: initialSharedTasks
      }

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'projects', projectId), projectData)
      } else {
        localStorage.setItem(`project_${projectId}`, JSON.stringify(projectData))
      }

      // Automatically sign in admin in sessionStorage
      sessionStorage.setItem(`taskforge_auth_${projectId}`, '1')
      sessionStorage.setItem(`taskforge_user_${projectId}`, JSON.stringify(adminMember))

      navigate(`/project/${projectId}`)
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 500, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to home
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Create New Project Workspace</h2>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: '2rem' }}>Set up your project details, deadline, and team roster.</p>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Project Name *</label>
            <input 
              type="text"
              placeholder="e.g. HomeOS Launch"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, outline: 'none' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Target Deadline Date *</label>
            <input 
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, outline: 'none' }}
              required
            />
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Admin Profile (You)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Your Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Alex"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Set Your PIN *</label>
                <input 
                  type="password"
                  placeholder="4-8 digits"
                  maxLength={8}
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Add Team Members</label>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Team members will pick their own PIN when they first join.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input 
                type="text"
                placeholder="Member name"
                value={memberInput}
                onChange={e => setMemberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMember())}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
              />
              <button 
                type="button"
                onClick={addMember}
                style={{ padding: '9px 16px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
              >
                + Add
              </button>
            </div>

            {members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#1E40AF', padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                    <span>{m.name}</span>
                    <button type="button" onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: '#1E40AF', cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 15, marginTop: 10 }}
          >
            {loading ? 'Creating Project...' : 'Create Workspace & Launch →'}
          </button>
        </form>
      </div>
    </div>
  )
}
