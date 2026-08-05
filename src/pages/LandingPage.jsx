import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

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
            style={{ padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
          >
            Create Project
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: '1.5rem' }}>
          🚀 Custom Project Tracker for High-Performing Teams
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          Launch your projects faster with shared & private task tracking.
        </h1>

        <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: '#64748B', maxWidth: 640, marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Set up a custom workspace in 30 seconds. Define your deadline, set team PINs, manage shared team objectives alongside private personal to-do lists in real-time.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/create')}
            style={{ padding: '14px 32px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 16, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
          >
            Start a New Project →
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, width: '100%', marginTop: '5rem', textAlign: 'left' }}>
          {[
            { icon: '🔒', title: 'Private & Personal PINs', desc: 'Every team member unlocks with their custom PIN. Keep personal to-dos completely private.' },
            { icon: '⏱️', title: 'Live Countdown Timer', desc: 'Keep momentum high with a real-time ticking deadline countdown right on your dashboard.' },
            { icon: '⚡', title: 'Real-time Sync', desc: 'Collaborate live. Task updates and member online status reflect across all screens instantly.' },
            { icon: '✏️', title: 'Dynamic Edit Mode', desc: 'Add, update, or remove phases and tasks dynamically without losing checkbox progress.' }
          ].map((f, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 32, marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>{f.desc}</p>
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
