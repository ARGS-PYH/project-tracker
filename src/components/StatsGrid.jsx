export default function StatsGrid({ sharedTasks, checkedState }) {
  const allItems = sharedTasks.flatMap(g => g.items || [])
  const totalTasks = allItems.length
  const completedTasks = allItems.filter(item => checkedState[item.id]).length
  const pct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const p1Items = sharedTasks.filter(g => (g.phase || 1) === 1).flatMap(g => g.items || [])
  const p1Done = p1Items.filter(item => checkedState[item.id]).length

  const p2Items = sharedTasks.filter(g => g.phase === 2).flatMap(g => g.items || [])
  const p2Done = p2Items.filter(item => checkedState[item.id]).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
      {[
        { label: 'Total Shared Tasks', value: totalTasks, sub: `${completedTasks} completed`, color: 'var(--text-main)' },
        { label: 'Overall Progress', value: `${pct}%`, sub: `${completedTasks}/${totalTasks} tasks`, color: 'var(--brand-text)' },
        { label: 'Phase 1', value: `${p1Items.length === 0 ? 0 : Math.round((p1Done / p1Items.length) * 100)}%`, sub: `${p1Done}/${p1Items.length} tasks`, color: '#60A5FA' },
        { label: 'Phase 2', value: `${p2Items.length === 0 ? 0 : Math.round((p2Done / p2Items.length) * 100)}%`, sub: `${p2Done}/${p2Items.length} tasks`, color: '#A78BFA' },
      ].map(({ label, value, sub, color }) => (
        <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>{sub}</div>
        </div>
      ))}
    </div>
  )
}
