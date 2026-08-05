import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, setDoc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase.js'
import PinGate from '../components/PinGate.jsx'
import Countdown from '../components/Countdown.jsx'
import SharedTasks from '../components/SharedTasks.jsx'
import MyTasks from '../components/MyTasks.jsx'
import StatsGrid from '../components/StatsGrid.jsx'
import PresenceBar from '../components/PresenceBar.jsx'

export default function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(() => {
    try {
      const local = localStorage.getItem(`project_${projectId}`)
      return local ? JSON.parse(local) : null
    } catch { return null }
  })
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`taskforge_user_${projectId}`)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(`taskforge_auth_${projectId}`))
  const [checkedState, setCheckedState] = useState(() => {
    try {
      const local = localStorage.getItem(`project_checked_${projectId}`)
      return local ? JSON.parse(local) : {}
    } catch { return {} }
  })
  const [privateTasks, setPrivateTasks] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem(`taskforge_user_${projectId}`)
      if (storedUser) {
        const u = JSON.parse(storedUser)
        const local = localStorage.getItem(`project_private_${projectId}_${u.id}`)
        return local ? JSON.parse(local) : []
      }
      return []
    } catch { return [] }
  })
  const [activeUsers, setActiveUsers] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState(0)
  const [activeTab, setActiveTab] = useState('shared') // 'shared' | 'private'
  const [copied, setCopied] = useState(false)

  // 1. Fetch Project Details
  useEffect(() => {
    if (!projectId) return

    // Load local first
    const local = localStorage.getItem(`project_${projectId}`)
    if (local) {
      setProject(JSON.parse(local))
    }

    if (isFirebaseConfigured && db) {
      try {
        const unsub = onSnapshot(doc(db, 'projects', projectId), (snap) => {
          if (snap.exists()) {
            setProject(snap.data())
            localStorage.setItem(`project_${projectId}`, JSON.stringify(snap.data()))
          }
        }, (err) => console.warn('Firestore snapshot notice:', err))
        return unsub
      } catch (e) {
        console.warn('Firestore init failed, using local storage:', e)
      }
    }
  }, [projectId])

  // 2. Real-time Checked State Listener
  useEffect(() => {
    if (!authed || !projectId) return

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'projects', projectId, 'state', 'checked')
        const unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const { _ts, ...data } = snap.data()
            setCheckedState(data)
            localStorage.setItem(`project_checked_${projectId}`, JSON.stringify(data))
          }
        }, (err) => console.warn('Checked snapshot notice:', err))
        return unsub
      } catch (e) {
        console.warn('Checked state firestore notice:', e)
      }
    }
  }, [authed, projectId])

  // 3. Real-time Private Tasks Listener
  useEffect(() => {
    if (!authed || !projectId || !currentUser) return

    const localPriv = localStorage.getItem(`project_private_${projectId}_${currentUser.id}`)
    if (localPriv) setPrivateTasks(JSON.parse(localPriv))

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'projects', projectId, 'private', currentUser.id)
        const unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const tasks = snap.data().tasks || []
            setPrivateTasks(tasks)
            localStorage.setItem(`project_private_${projectId}_${currentUser.id}`, JSON.stringify(tasks))
          }
        }, (err) => console.warn('Private tasks snapshot notice:', err))
        return unsub
      } catch (e) {
        console.warn('Private tasks notice:', e)
      }
    }
  }, [authed, projectId, currentUser])

  // 4. Presence Heartbeat
  useEffect(() => {
    if (!authed || !projectId || !currentUser) return

    const presenceId = currentUser.id
    if (isFirebaseConfigured && db) {
      try {
        const presenceRef = doc(db, 'projects', projectId, 'presence', presenceId)
        const updatePresence = async () => {
          try {
            await setDoc(presenceRef, { name: currentUser.name, lastSeen: serverTimestamp() }, { merge: true })
          } catch (err) { console.warn('Presence error:', err) }
        }

        updatePresence()
        const interval = setInterval(updatePresence, 5000)

        const presenceQuery = query(collection(db, 'projects', projectId, 'presence'), orderBy('lastSeen', 'desc'))
        const unsub = onSnapshot(presenceQuery, (snap) => {
          const now = Date.now()
          const users = snap.docs
            .map(d => d.data())
            .filter(u => u.name && u.lastSeen?.toMillis && (now - u.lastSeen.toMillis() < 30000))
          setActiveUsers(users)
        })

        return () => { clearInterval(interval); unsub() }
      } catch (e) {
        console.warn('Presence firestore notice:', e)
      }
    }
  }, [authed, projectId, currentUser])

  // Handle Toggle Shared Task
  const handleToggleTask = useCallback(async (taskId) => {
    if (!currentUser || !projectId) return
    const isChecked = !checkedState[taskId]
    const now = new Date()
    const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const updated = {
      ...checkedState,
      [taskId]: isChecked,
      [`${taskId}__meta`]: isChecked ? { by: currentUser.name, at: timeStr } : null
    }

    setCheckedState(updated)
    localStorage.setItem(`project_checked_${projectId}`, JSON.stringify(updated))

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'projects', projectId, 'state', 'checked')
        await setDoc(ref, {
          [taskId]: isChecked,
          [`${taskId}__meta`]: isChecked ? { by: currentUser.name, at: timeStr } : null,
          _ts: serverTimestamp()
        }, { merge: true })
      } catch (e) {
        console.warn('Toggle task firestore sync notice:', e)
      }
    }
  }, [checkedState, currentUser, projectId])

  // Save Shared Tasks Config (Edit Mode)
  const handleSaveSharedTasks = async (newSharedTasks) => {
    if (!project || !projectId) return
    const updatedProject = { ...project, sharedTasks: newSharedTasks }
    setProject(updatedProject)
    localStorage.setItem(`project_${projectId}`, JSON.stringify(updatedProject))

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'projects', projectId), { sharedTasks: newSharedTasks }, { merge: true })
      } catch (e) {
        console.warn('Save shared tasks notice:', e)
      }
    }
  }

  // Save Private Tasks
  const handleSavePrivateTasks = async (newPrivateTasks) => {
    if (!currentUser || !projectId) return
    setPrivateTasks(newPrivateTasks)
    localStorage.setItem(`project_private_${projectId}_${currentUser.id}`, JSON.stringify(newPrivateTasks))

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'projects', projectId, 'private', currentUser.id), { tasks: newPrivateTasks }, { merge: true })
      } catch (e) {
        console.warn('Save private tasks notice:', e)
      }
    }
  }

  const handleUnlock = (user) => {
    sessionStorage.setItem(`taskforge_auth_${projectId}`, '1')
    sessionStorage.setItem(`taskforge_user_${projectId}`, JSON.stringify(user))
    setCurrentUser(user)
    setAuthed(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(`taskforge_auth_${projectId}`)
    sessionStorage.removeItem(`taskforge_user_${projectId}`)
    setAuthed(false)
    setCurrentUser(null)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#64748B' }}>
        Loading project workspace...
      </div>
    )
  }

  if (!authed || !currentUser) {
    return <PinGate project={project} onUnlock={handleUnlock} />
  }

  const sharedTasks = project.sharedTasks || []
  const filteredSharedTasks = phaseFilter === 0 
    ? sharedTasks 
    : sharedTasks.filter(g => (g.phase || 1) === phaseFilter)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header Bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #E2E8F0', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.25rem', height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>T</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{project.name}</span>
          </div>

          <button 
            onClick={copyShareLink}
            style={{ fontSize: 11, padding: '4px 10px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
          >
            {copied ? '✓ Link Copied!' : '🔗 Share Link'}
          </button>

          <div style={{ flex: 1 }} />

          <PresenceBar activeUsers={activeUsers} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <div style={{ fontSize: 12, padding: '4px 12px', background: '#F1F5F9', color: '#1E293B', borderRadius: 20, fontWeight: 600 }}>
              {currentUser.name} {currentUser.isAdmin ? '👑' : ''}
            </div>

            <button 
              onClick={() => setEditMode(!editMode)} 
              style={{ fontSize: 11, padding: '5px 10px', background: editMode ? '#2563EB' : '#FFFFFF', color: editMode ? '#FFFFFF' : '#64748B', border: '1px solid #CBD5E1', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
            >
              {editMode ? 'Done' : '✏️ Edit'}
            </button>

            <button 
              onClick={handleLogout} 
              title="Logout" 
              style={{ fontSize: 11, padding: '5px 10px', background: 'transparent', color: '#94A3B8', border: '1px solid #CBD5E1', borderRadius: 20, fontWeight: 500, cursor: 'pointer' }}
            >
              ↩ Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {/* Countdown Component */}
        <Countdown deadline={project.deadline} />

        {/* Stats Grid */}
        <StatsGrid sharedTasks={sharedTasks} checkedState={checkedState} />

        {/* Main Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setActiveTab('shared')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: activeTab === 'shared' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                background: activeTab === 'shared' ? '#EFF6FF' : '#FFFFFF',
                color: activeTab === 'shared' ? '#2563EB' : '#64748B'
              }}
            >
              👥 Team Shared Tasks
            </button>

            <button 
              onClick={() => setActiveTab('private')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: activeTab === 'private' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                background: activeTab === 'private' ? '#EFF6FF' : '#FFFFFF',
                color: activeTab === 'private' ? '#2563EB' : '#64748B'
              }}
            >
              🔒 My Private Tasks
            </button>
          </div>

          {activeTab === 'shared' && (
            <div style={{ display: 'flex', gap: 6 }}>
              {[[0, 'All Phases'], [1, 'Phase 1'], [2, 'Phase 2'], [3, 'Phase 3']].map(([v, label]) => (
                <button 
                  key={v} 
                  onClick={() => setPhaseFilter(v)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: phaseFilter === v ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    background: phaseFilter === v ? '#2563EB' : '#FFFFFF',
                    color: phaseFilter === v ? '#FFFFFF' : '#64748B'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'shared' ? (
          <SharedTasks 
            sharedTasks={filteredSharedTasks}
            checkedState={checkedState}
            onToggle={handleToggleTask}
            user={currentUser}
            editMode={editMode}
            onSaveTasks={handleSaveSharedTasks}
          />
        ) : (
          <MyTasks 
            privateTasks={privateTasks}
            onSavePrivateTasks={handleSavePrivateTasks}
          />
        )}

        <footer style={{ textAlign: 'center', padding: '2.5rem 0 1rem', fontSize: 12, color: '#94A3B8' }}>
          TaskForge Workspace · Built for seamless project execution
        </footer>
      </main>
    </div>
  )
}
