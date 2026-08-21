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
      <div style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)', borderRadius: 16, padding: '16px 20px', marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-text)', margin: 0 }}>🚀 Target Date Arrived / Launch Day!</h2>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', marginBottom: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span>⏱️</span> TARGET LAUNCH COUNTDOWN ({new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        {[
          { label: 'Days', value: days },
          { label: 'Hours', value: hours },
          { label: 'Mins', value: minutes },
          { label: 'Secs', value: seconds },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--card-sub-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', minWidth: 64 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-text)', lineHeight: 1, fontFamily: 'monospace' }}>
              {value.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
