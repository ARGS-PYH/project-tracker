import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase.js'

export default function CreateProjectPage() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [memberPinInput, setMemberPinInput] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project'
  }

  const addMember = () => {
    const trimmedName = memberInput.trim()
    if (!trimmedName) return

    if (members.some(m => m.name.toLowerCase() === trimmedName.toLowerCase()) || trimmedName.toLowerCase() === adminName.trim().toLowerCase()) {
      setError('Member name already exists in roster.')
      return
    }

    const assignedPin = memberPinInput.trim() || generateRandomPin()

    setMembers([
      ...members, 
      { 
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, 
        name: trimmedName, 
        pin: assignedPin,
        isAdmin: false
      }
    ])

    setMemberInput('')
    setMemberPinInput('')
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
      const baseSlug = slugify(projectName)
      let finalProjectId = baseSlug

      // Check collision in localStorage
      if (localStorage.getItem(`project_${finalProjectId}`)) {
        finalProjectId = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`
      }

      // Check collision in Firestore if configured
      if (isFirebaseConfigured && db) {
        try {
          const snap = await getDoc(doc(db, 'projects', finalProjectId))
          if (snap.exists()) {
            finalProjectId = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`
          }
        } catch (e) {
          console.warn('Firestore slug check notice:', e)
        }
      }

      const adminMember = {
        id: `admin_${Date.now()}`,
        name: adminName.trim(),
        pin: adminPin.trim(),
        isAdmin: true
      }

      const formattedMembers = [
        adminMember,
        ...members
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
        id: finalProjectId,
        name: projectName.trim(),
        deadline,
        createdAt: new Date().toISOString(),
        members: formattedMembers,
        sharedTasks: initialSharedTasks
      }

      // Always save to localStorage for instant local access
      localStorage.setItem(`project_${finalProjectId}`, JSON.stringify(projectData))

      // Try writing to Firestore if configured
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'projects', finalProjectId), {
            ...projectData,
            createdAt: serverTimestamp()
          })
        } catch (fsErr) {
          console.warn('Firestore write fallback to local storage:', fsErr)
        }
      }

      // Automatically sign in admin in sessionStorage
      sessionStorage.setItem(`taskforge_auth_${finalProjectId}`, '1')
      sessionStorage.setItem(`taskforge_user_${finalProjectId}`, JSON.stringify(adminMember))

      navigate(`/project/${finalProjectId}`)
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 580, background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 16, padding: '2.5rem', boxShadow: '0 12px 28px -20px rgba(36,33,29,0.35)' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#746E64', fontSize: 13, fontWeight: 500, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          Back to home
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#24211D', marginBottom: 6 }}>Create New Project Workspace</h2>
        <p style={{ fontSize: 14, color: '#746E64', marginBottom: '2rem' }}>Set up your project details, deadline, and assign team PINs.</p>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Project Title Name *</label>
            <input 
              type="text"
              placeholder="Example Launch"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, outline: 'none', background: '#FFFDF8' }}
              required
            />
            {projectName.trim() && (
              <div style={{ fontSize: 12, color: '#5F7A61', marginTop: 4, fontWeight: 500 }}>
                Project URL ID will be: <strong>/project/{slugify(projectName)}</strong>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Target Deadline Date *</label>
            <input 
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, outline: 'none', background: '#FFFDF8' }}
              required
            />
          </div>

          <div style={{ borderTop: '1px solid #DED8CD', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#24211D', marginBottom: 12 }}>Admin Profile (You)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Your Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Alex"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, outline: 'none', background: '#FFFDF8' }}
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
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, outline: 'none', background: '#FFFDF8' }}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #DED8CD', paddingTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Add Team Members & Assign PINs</label>
            <p style={{ fontSize: 12, color: '#746E64', marginBottom: 12 }}>Enter member name and optional PIN (or click Add Member to auto-generate a PIN).</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, marginBottom: 12 }}>
              <input 
                type="text"
                placeholder="Member name"
                value={memberInput}
                onChange={e => setMemberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMember())}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, background: '#FFFDF8' }}
              />
              <input 
                type="text"
                placeholder="PIN (4 digits)"
                maxLength={8}
                value={memberPinInput}
                onChange={e => setMemberPinInput(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 8, border: '1.5px solid #CFC7B9', fontSize: 14, textAlign: 'center', background: '#FFFDF8' }}
              />
              <button 
                type="button"
                onClick={addMember}
                style={{ padding: '9px 16px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                + Add Member
              </button>
            </div>

            {members.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EEF3ED', color: '#3F5F45', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      <span style={{ background: '#E2EBDD', color: '#3F5F45', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>
                        PIN: {m.pin}
                      </span>
                    </div>
                    <button type="button" onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 15, marginTop: 10, cursor: 'pointer' }}
          >
            {loading ? 'Creating Project...' : 'Create Workspace & Launch'}
          </button>
        </form>
      </div>
    </div>
  )
}
