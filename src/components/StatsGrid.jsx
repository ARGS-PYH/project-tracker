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
        { label: 'Total Shared Tasks', value: totalTasks, sub: `${completedTasks} completed` },
        { label: 'Overall Progress', value: `${pct}%`, sub: `${completedTasks}/${totalTasks} tasks` },
        { label: 'Phase 1', value: `${p1Items.length === 0 ? 0 : Math.round((p1Done / p1Items.length) * 100)}%`, sub: `${p1Done}/${p1Items.length} tasks` },
        { label: 'Phase 2', value: `${p2Items.length === 0 ? 0 : Math.round((p2Done / p2Items.length) * 100)}%`, sub: `${p2Done}/${p2Items.length} tasks` },
      ].map(({ label, value, sub }) => (
        <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{sub}</div>
        </div>
      ))}
    </div>
  )
}
