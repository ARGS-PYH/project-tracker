import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function LandingPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: isDark ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#5F7A61', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, boxShadow: isDark ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none' }}>P</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>PLTK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <button 
              onClick={() => navigate('/create')}
              style={{ padding: '8px 18px', background: isDark ? '#10B981' : '#5F7A61', color: isDark ? '#090D16' : '#FFFFFF', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: isDark ? '0 0 14px rgba(16, 185, 129, 0.3)' : 'none' }}
            >
              + Create Project
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1.5rem', textAlign: 'center', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#EEF3ED', color: isDark ? '#34D399' : '#3F5F45', border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #D4DEC9', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: '1.5rem' }}>
          🚀 Product Lunch Tracker for High-Performing Teams
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          Launch your products on time with focused team tracking.
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--text-muted)', maxWidth: 640, marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Set up a custom workspace in 30 seconds. Define your deadline, manage team PINs, and track shared launch objectives alongside private personal to-do lists in real time.
        </p>

        {/* CTA & Join Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 520, margin: '0 auto 4rem' }}>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '14px 32px', background: isDark ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#5F7A61', color: isDark ? '#090D16' : '#FFFFFF', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: isDark ? '0 4px 20px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(95, 122, 97, 0.3)', cursor: 'pointer' }}
          >
            Start a New Project Workspace →
          </button>

          {/* Jump to Project Form */}
          <form onSubmit={handleOpenProject} style={{ display: 'flex', gap: 8, background: 'var(--card-bg)', padding: '6px 6px 6px 14px', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <input 
              type="text"
              placeholder="Enter Project Title Name or Link..."
              value={projectIdInput}
              onChange={e => setProjectIdInput(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--text-main)' }}
            />
            <button 
              type="submit"
              style={{ padding: '10px 18px', background: isDark ? '#1F293D' : '#5F7A61', color: '#F9FAFB', border: isDark ? '1px solid #2D3748' : 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
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
            <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 28, marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center', fontSize: 13, color: 'var(--text-sub)', background: 'var(--bg)' }}>
        Product Lunch Tracker (PLTK) · Built for focused project execution
      </footer>
    </div>
  )
}
