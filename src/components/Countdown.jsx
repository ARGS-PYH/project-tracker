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
      <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '16px 20px', marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#065F46', margin: 0 }}>🚀 Target Date Arrived / Launch Day!</h2>
      </div>
    )
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
        ⏱️ Target Launch Countdown ({new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
        {[
          { label: 'Days', value: days },
          { label: 'Hours', value: hours },
          { label: 'Mins', value: minutes },
          { label: 'Secs', value: seconds },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 50 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1, fontFamily: 'monospace' }}>
              {value.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
