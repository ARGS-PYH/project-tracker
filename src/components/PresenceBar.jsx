export default function PresenceBar({ activeUsers, lastAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      {activeUsers && activeUsers.length > 0 && (
        <div style={{ fontSize: 11, color: '#34D399', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
          Active: {activeUsers.map(u => u.name).join(', ')}
        </div>
      )}
      {lastAction && (
        <div style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
          Last action: {lastAction.by} checked "{lastAction.taskLabel}" at {lastAction.at}
        </div>
      )}
    </div>
  )
}
