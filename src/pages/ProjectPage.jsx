import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, setDoc, getDoc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore'
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

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`taskforge_user_${projectId}`)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(`taskforge_auth_${projectId}`))
  const [checkedState, setCheckedState] = useState({})
  const [privateTasks, setPrivateTasks] = useState([])
  const [activeUsers, setActiveUsers] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState(0)
  const [activeTab, setActiveTab] = useState('shared') // 'shared' | 'private'
  const [copied, setCopied] = useState(false)

  // 1. Fetch Project Details with Name / ID Lookup & Error Handling
  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      setNotFound(true)
      return
    }

    setLoading(true)
    setNotFound(false)

    const cleanInput = projectId.trim().toLowerCase()

    // Helper: Search local storage for matching ID, slug, or Title Name
    const findLocalProject = () => {
      // Direct key check
      const direct = localStorage.getItem(`project_${projectId}`)
      if (direct) {
        try { return JSON.parse(direct) } catch {}
      }

      // Loop through localStorage for name/slug match
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('project_')) {
          try {
            const p = JSON.parse(localStorage.getItem(key))
            if (p && (p.id?.toLowerCase() === cleanInput || p.name?.toLowerCase() === cleanInput)) {
              return p
            }
          } catch {}
        }
      }
      return null
    }

    const localFound = findLocalProject()
    if (localFound) {
      setProject(localFound)
      setLoading(false)
    }

    // Try Firestore lookup
    if (isFirebaseConfigured && db) {
      try {
        const unsub = onSnapshot(doc(db, 'projects', projectId), (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            setProject(data)
            setNotFound(false)
            setLoading(false)
            localStorage.setItem(`project_${data.id}`, JSON.stringify(data))
          } else if (!localFound) {
            // Firestore returned empty and local didn't find it
            setLoading(false)
            setNotFound(true)
          }
        }, (err) => {
          console.warn('Firestore snapshot error:', err)
          if (!localFound) {
            setLoading(false)
            setNotFound(true)
          }
        })
        return unsub
      } catch (e) {
        console.warn('Firestore init notice:', e)
        if (!localFound) {
          setLoading(false)
          setNotFound(true)
        }
      }
    } else if (!localFound) {
      setLoading(false)
      setNotFound(true)
    }
  }, [projectId])

  // 2. Real-time Checked State Listener
  useEffect(() => {
    if (!authed || !projectId) return

    const targetId = project?.id || projectId

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'projects', targetId, 'state', 'checked')
        const unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const { _ts, ...data } = snap.data()
            setCheckedState(data)
            localStorage.setItem(`project_checked_${targetId}`, JSON.stringify(data))
          }
        }, (err) => console.warn('Checked snapshot notice:', err))
        return unsub
      } catch (e) {
        console.warn('Checked state firestore notice:', e)
      }
    }
  }, [authed, projectId, project])

  // 3. Real-time Private Tasks Listener
  useEffect(() => {
    if (!authed || !projectId || !currentUser) return

    const targetId = project?.id || projectId
    const localPriv = localStorage.getItem(`project_private_${targetId}_${currentUser.id}`)
    if (localPriv) setPrivateTasks(JSON.parse(localPriv))

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'projects', targetId, 'private', currentUser.id)
        const unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const tasks = snap.data().tasks || []
            setPrivateTasks(tasks)
            localStorage.setItem(`project_private_${targetId}_${currentUser.id}`, JSON.stringify(tasks))
          }
        }, (err) => console.warn('Private tasks snapshot notice:', err))
        return unsub
      } catch (e) {
        console.warn('Private tasks notice:', e)
      }
    }
  }, [authed, projectId, currentUser, project])

  // 4. Presence Heartbeat
  useEffect(() => {
    if (!authed || !projectId || !currentUser) return

    const targetId = project?.id || projectId
    const presenceId = currentUser.id
    if (isFirebaseConfigured && db) {
      try {
        const presenceRef = doc(db, 'projects', targetId, 'presence', presenceId)
        const updatePresence = async () => {
          try {
            await setDoc(presenceRef, { name: currentUser.name, lastSeen: serverTimestamp() }, { merge: true })
          } catch (err) { console.warn('Presence error:', err) }
        }

        updatePresence()
        const interval = setInterval(updatePresence, 5000)

        const presenceQuery = query(collection(db, 'projects', targetId, 'presence'), orderBy('lastSeen', 'desc'))
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
  }, [authed, projectId, currentUser, project])

  // Handle Toggle Shared Task
  const handleToggleTask = useCallback(async (taskId) => {
    if (!currentUser || !project) return
    const targetId = project.id
    const isChecked = !checkedState[taskId]
    const now = new Date()
    const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const updated = {
      ...checkedState,
      [taskId]: isChecked,
      [`${taskId}__meta`]: isChecked ? { by: currentUser.name, at: timeStr } : null
    }

    setCheckedState(updated)
    localStorage.setItem(`project_checked_${targetId}`, JSON.stringify(updated))

    if (isFirebaseConfigured && db) {
      try {
        const ref = doc(db, 'projects', targetId, 'state', 'checked')
        await setDoc(ref, {
          [taskId]: isChecked,
          [`${taskId}__meta`]: isChecked ? { by: currentUser.name, at: timeStr } : null,
          _ts: serverTimestamp()
        }, { merge: true })
      } catch (e) {
        console.warn('Toggle task firestore sync notice:', e)
      }
    }
  }, [checkedState, currentUser, project])

  // Save Shared Tasks Config (Edit Mode)
  const handleSaveSharedTasks = async (newSharedTasks) => {
    if (!project) return
    const targetId = project.id
    const updatedProject = { ...project, sharedTasks: newSharedTasks }
    setProject(updatedProject)
    localStorage.setItem(`project_${targetId}`, JSON.stringify(updatedProject))

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'projects', targetId), { sharedTasks: newSharedTasks }, { merge: true })
      } catch (e) {
        console.warn('Save shared tasks notice:', e)
      }
    }
  }

  // Save Private Tasks
  const handleSavePrivateTasks = async (newPrivateTasks) => {
    if (!currentUser || !project) return
    const targetId = project.id
    setPrivateTasks(newPrivateTasks)
    localStorage.setItem(`project_private_${targetId}_${currentUser.id}`, JSON.stringify(newPrivateTasks))

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'projects', targetId, 'private', currentUser.id), { tasks: newPrivateTasks }, { merge: true })
      } catch (e) {
        console.warn('Save private tasks notice:', e)
      }
    }
  }

  const handleUnlock = (user) => {
    const targetId = project?.id || projectId
    sessionStorage.setItem(`taskforge_auth_${targetId}`, '1')
    sessionStorage.setItem(`taskforge_user_${targetId}`, JSON.stringify(user))
    setCurrentUser(user)
    setAuthed(true)
  }

  const handleLogout = () => {
    const targetId = project?.id || projectId
    sessionStorage.removeItem(`taskforge_auth_${targetId}`)
    sessionStorage.removeItem(`taskforge_user_${targetId}`)
    setAuthed(false)
    setCurrentUser(null)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSearchRetry = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    let q = searchQuery.trim()
    if (q.includes('/project/')) {
      q = q.split('/project/')[1].split('?')[0].split('#')[0]
    }
    navigate(`/project/${q}`)
  }

  // Project Not Found Screen
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 16, padding: '2.5rem', textAlign: 'center', boxShadow: '0 12px 28px -20px rgba(36,33,29,0.35)' }}>
          <div style={{ width: 64, height: 64, background: '#FEF2F2', color: '#EF4444', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: 32 }}>
            !
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#24211D', marginBottom: 8 }}>Project Workspace Not Found</h2>
          <p style={{ fontSize: 13, color: '#746E64', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            We couldn't find any project matching <strong>"{projectId}"</strong>. Please verify the URL or try searching by project ID/title below.
          </p>

          <form onSubmit={handleSearchRetry} style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
            <input 
              type="text"
              placeholder="Enter Project ID or Title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
            />
            <button 
              type="submit"
              style={{ padding: '10px 16px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ padding: '10px 20px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Back to Home
            </button>
            <button 
              onClick={() => navigate('/create')}
              style={{ padding: '10px 20px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              + Create Project
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading Screen
  if (loading && !project) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0', color: '#746E64', fontSize: 14 }}>
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
    <div style={{ minHeight: '100vh', background: '#F7F5F0' }}>
      {/* Header Bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,253,248,0.95)', borderBottom: '1px solid #DED8CD', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.25rem', height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: '#5F7A61', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#24211D' }}>{project.name}</span>
          </div>

          <button 
            onClick={copyShareLink}
            style={{ fontSize: 11, padding: '4px 10px', background: '#EEF3ED', color: '#3F5F45', border: '1px solid #D4DEC9', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
          >
            {copied ? 'Link Copied!' : 'Share Link'}
          </button>

          <div style={{ flex: 1 }} />

          <PresenceBar activeUsers={activeUsers} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <div style={{ fontSize: 12, padding: '4px 12px', background: '#EFEAE1', color: '#24211D', borderRadius: 20, fontWeight: 600 }}>
              {currentUser.name} {currentUser.isAdmin ? '(Admin)' : ''}
            </div>

            <button 
              onClick={() => setEditMode(!editMode)} 
              style={{ fontSize: 11, padding: '5px 10px', background: editMode ? '#5F7A61' : '#FFFDF8', color: editMode ? '#FFFFFF' : '#746E64', border: '1px solid #CFC7B9', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>

            <button 
              onClick={handleLogout} 
              title="Logout" 
              style={{ fontSize: 11, padding: '5px 10px', background: 'transparent', color: '#94A3B8', border: '1px solid #CBD5E1', borderRadius: 20, fontWeight: 500, cursor: 'pointer' }}
            >
              Exit
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
                border: activeTab === 'shared' ? '1.5px solid #5F7A61' : '1px solid #DED8CD',
                background: activeTab === 'shared' ? '#EEF3ED' : '#FFFDF8',
                color: activeTab === 'shared' ? '#3F5F45' : '#746E64'
              }}
            >
              Team Shared Tasks
            </button>

            <button 
              onClick={() => setActiveTab('private')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: activeTab === 'private' ? '1.5px solid #5F7A61' : '1px solid #DED8CD',
                background: activeTab === 'private' ? '#EEF3ED' : '#FFFDF8',
                color: activeTab === 'private' ? '#3F5F45' : '#746E64'
              }}
            >
              My Private Tasks
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
                    border: phaseFilter === v ? '1px solid #5F7A61' : '1px solid #DED8CD',
                    background: phaseFilter === v ? '#5F7A61' : '#FFFDF8',
                    color: phaseFilter === v ? '#FFFFFF' : '#746E64'
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
          Product Lunch Tracker (PLTK) Workspace - Built for focused project execution
        </footer>
      </main>
    </div>
  )
}
