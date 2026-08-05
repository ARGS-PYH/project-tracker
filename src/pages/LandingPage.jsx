import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()
  const [recentProjects, setRecentProjects] = useState([])
  const [projectIdInput, setProjectIdInput] = useState('')

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || text
  }

  useEffect(() => {
    try {
      // Find all projects in localStorage
      const recents = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('project_')) {
          try {
            const p = JSON.parse(localStorage.getItem(key))
            if (p && p.id && p.name && !recents.some(r => r.id === p.id)) {
              recents.push(p)
            }
          } catch {}
        }
      }
      setRecentProjects(recents)
    } catch {}
  }, [])

  const handleOpenProject = (e) => {
    e.preventDefault()
    let input = projectIdInput.trim()
    if (!input) return

    // If full URL was pasted, extract the project ID
    if (input.includes('/project/')) {
      input = input.split('/project/')[1].split('?')[0].split('#')[0]
    }

    // Convert spaces/capitalization to slug if title name was typed
    const targetSlug = slugify(input)
    navigate(`/project/${targetSlug}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>T</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>TaskForge</span>
          </div>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            + Create Project
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3.5rem 1.5rem', textAlign: 'center', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: '1.5rem' }}>
          🚀 Custom Project Tracker for High-Performing Teams
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          Launch your projects faster with shared & private task tracking.
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#64748B', maxWidth: 640, marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Set up a custom workspace in 30 seconds. Define your deadline, set team PINs, manage shared team objectives alongside private personal to-do lists in real-time.
        </p>

        {/* CTA & Join Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 520, margin: '0 auto 3rem' }}>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '14px 32px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 16, boxShadow: '0 4px 14px rgba(37,99,235,0.3)', cursor: 'pointer' }}
          >
            Start a New Project Workspace →
          </button>

          {/* Jump to Project Form */}
          <form onSubmit={handleOpenProject} style={{ display: 'flex', gap: 8, background: '#FFFFFF', padding: '6px 6px 6px 14px', borderRadius: 12, border: '1.5px solid #CBD5E1', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <input 
              type="text"
              placeholder="Enter Project Title Name or Link..."
              value={projectIdInput}
              onChange={e => setProjectIdInput(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
            />
            <button 
              type="submit"
              style={{ padding: '10px 18px', background: '#1E293B', color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Open Project →
            </button>
          </form>
        </div>

        {/* Recent Workspaces Section (If Any) */}
        {recentProjects.length > 0 && (
          <div style={{ width: '100%', marginBottom: '4rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              📁 Your Recent Workspaces
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {recentProjects.map(p => (
                <div 
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  style={{
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.25rem',
                    cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Target Deadline: {new Date(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 11, color: '#2563EB', marginTop: 10, fontWeight: 600 }}>
                    Open Workspace → (/project/{p.id})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, width: '100%', textAlign: 'left' }}>
          {[
            { icon: '🔒', title: 'Private & Personal PINs', desc: 'Every team member unlocks with their custom PIN. Keep personal to-dos completely private.' },
            { icon: '⏱️', title: 'Live Countdown Timer', desc: 'Keep momentum high with a real-time ticking deadline countdown right on your dashboard.' },
            { icon: '⚡', title: 'Real-time Sync', desc: 'Collaborate live. Task updates and member online status reflect across all screens instantly.' },
            { icon: '✏️', title: 'Dynamic Edit Mode', desc: 'Add, update, or remove phases and tasks dynamically without losing checkbox progress.' }
          ].map((f, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 28, marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E2E8F0', padding: '1.5rem', textAlign: 'center', fontSize: 13, color: '#94A3B8', background: '#FFFFFF' }}>
        TaskForge · Built for fast-moving project execution
      </footer>
    </div>
  )
}
