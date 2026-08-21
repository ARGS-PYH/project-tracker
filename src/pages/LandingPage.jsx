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

    if (input.includes('/project/')) {
      input = input.split('/project/')[1].split('?')[0].split('#')[0]
    }

    const targetSlug = slugify(input)
    navigate(`/project/${targetSlug}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#090D16' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1F293D', background: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(12px)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)' }}>P</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', letterSpacing: '-0.02em' }}>PLTK</span>
          </div>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '10px 20px', background: '#10B981', color: '#090D16', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)' }}
          >
            + Create Project
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1.5rem', textAlign: 'center', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: '1.5rem' }}>
          🚀 Product Lunch Tracker for High-Performing Teams
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          Launch your products on time with focused team tracking.
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#9CA3AF', maxWidth: 640, marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Set up a custom workspace in 30 seconds. Define your deadline, manage team PINs, and track shared launch objectives alongside private personal to-do lists in real time.
        </p>

        {/* CTA & Join Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 520, margin: '0 auto 4rem' }}>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#090D16', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)', cursor: 'pointer' }}
          >
            Start a New Project Workspace →
          </button>

          {/* Jump to Project Form */}
          <form onSubmit={handleOpenProject} style={{ display: 'flex', gap: 8, background: '#111827', padding: '6px 6px 6px 14px', borderRadius: 12, border: '1px solid #1F293D', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <input 
              type="text"
              placeholder="Enter Project Title Name or Link..."
              value={projectIdInput}
              onChange={e => setProjectIdInput(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#F9FAFB' }}
            />
            <button 
              type="submit"
              style={{ padding: '10px 18px', background: '#1F293D', color: '#F9FAFB', border: '1px solid #2D3748', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Open Project →
            </button>
          </form>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, width: '100%', textAlign: 'left' }}>
          {[
            { icon: '🔒', title: 'Private & Personal PINs', desc: 'Every team member unlocks with their custom PIN. Keep personal to-dos completely private.' },
            { icon: '⏱️', title: 'Live Countdown Timer', desc: 'Keep momentum high with a real-time ticking deadline countdown right on your dashboard.' },
            { icon: '⚡', title: 'Real-time Sync', desc: 'Collaborate live. Task updates and member online status reflect across all screens instantly.' },
            { icon: '👑', title: 'Admin PIN Control', desc: 'Admins can invite members, assign PINs, and reset forgotten PINs with a master roster.' }
          ].map((f, i) => (
            <div key={i} style={{ background: '#111827', border: '1px solid #1F293D', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 28, marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1F293D', padding: '1.5rem', textAlign: 'center', fontSize: 13, color: '#6B7280', background: '#090D16' }}>
        Product Lunch Tracker (PLTK) · Built for focused project execution
      </footer>
    </div>
  )
}
