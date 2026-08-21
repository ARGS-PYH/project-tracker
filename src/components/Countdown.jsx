import { useState, useEffect } from 'react'

export default function Countdown({ deadline }) {
  const targetDate = new Date(`${deadline}T00:00:00`).getTime()
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetDate - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const days = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
  const minutes = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)))
  const seconds = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000))

  if (timeLeft < 0) {
    return (
      <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: '16px 20px', marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#34D399', margin: 0 }}>🚀 Target Date Arrived / Launch Day!</h2>
      </div>
    )
  }

  return (
    <div style={{ background: '#111827', border: '1px solid #1F293D', borderRadius: 16, padding: '18px 20px', marginBottom: '1.5rem', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span>⏱️</span> TARGET LAUNCH COUNTDOWN ({new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        {[
          { label: 'Days', value: days },
          { label: 'Hours', value: hours },
          { label: 'Mins', value: minutes },
          { label: 'Secs', value: seconds },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0D131F', border: '1px solid #1F293D', borderRadius: 12, padding: '10px 14px', minWidth: 64 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399', lineHeight: 1, fontFamily: 'monospace' }}>
              {value.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
