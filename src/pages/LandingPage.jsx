import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()
  const [projectIdInput, setProjectIdInput] = useState('')

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || text
  }

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F0' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #DED8CD', background: '#FFFDF8', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#5F7A61', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>P</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#24211D' }}>Product Lunch Tracker (PLTK)</span>
          </div>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '10px 20px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            + Create Project
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3.5rem 1.5rem', textAlign: 'center', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#EEF3ED', color: '#3F5F45', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: '1.5rem' }}>
          Simple project tracking for focused teams
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#24211D', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Product Lunch Tracker (PLTK)
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#746E64', maxWidth: 640, marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Set up a clean workspace in 30 seconds. Track shared milestones, private tasks, team PINs, and deadlines without extra noise.
        </p>

        {/* CTA & Join Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 520, margin: '0 auto 4rem' }}>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '14px 32px', background: '#5F7A61', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 16, boxShadow: '0 8px 18px rgba(95,122,97,0.18)', cursor: 'pointer' }}
          >
            Start a New Project Workspace
          </button>

          {/* Jump to Project Form */}
          <form onSubmit={handleOpenProject} style={{ display: 'flex', gap: 8, background: '#FFFDF8', padding: '6px 6px 6px 14px', borderRadius: 12, border: '1.5px solid #DED8CD', boxShadow: '0 2px 4px rgba(36,33,29,0.03)' }}>
            <input 
              type="text"
              placeholder="Enter Project Title Name or Link..."
              value={projectIdInput}
              onChange={e => setProjectIdInput(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
            />
            <button 
              type="submit"
              style={{ padding: '10px 18px', background: '#24211D', color: '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Open Project
            </button>
          </form>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, width: '100%', textAlign: 'left' }}>
          {[
            { icon: 'PIN', title: 'Private & Personal PINs', desc: 'Every team member unlocks with their custom PIN. Keep personal to-dos completely private.' },
            { icon: 'TIMER', title: 'Live Countdown Timer', desc: 'Keep momentum high with a real-time ticking deadline countdown right on your dashboard.' },
            { icon: 'SYNC', title: 'Real-time Sync', desc: 'Collaborate live. Task updates and member online status reflect across all screens instantly.' },
            { icon: 'EDIT', title: 'Dynamic Edit Mode', desc: 'Add, update, or remove phases and tasks dynamically without losing checkbox progress.' }
          ].map((f, i) => (
            <div key={i} style={{ background: '#FFFDF8', border: '1px solid #DED8CD', borderRadius: 12, padding: '1.5rem', boxShadow: '0 4px 10px -8px rgba(36,33,29,0.25)' }}>
              <div style={{ fontSize: 12, marginBottom: '0.75rem', color: '#5F7A61', fontWeight: 800 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#24211D', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#746E64', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #DED8CD', padding: '1.5rem', textAlign: 'center', fontSize: 13, color: '#8E877C', background: '#FFFDF8' }}>
        Product Lunch Tracker (PLTK) - Built for focused project execution
      </footer>
    </div>
  )
}
