export default function PresenceBar({ activeUsers, lastAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      {activeUsers && activeUsers.length > 0 && (
        <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
          Active: {activeUsers.map(u => u.name).join(', ')}
        </div>
      )}
      {lastAction && (
        <div style={{ fontSize: 10, color: '#746E64', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
          Last action: {lastAction.by} checked "{lastAction.taskLabel}" at {lastAction.at}
        </div>
      )}
    </div>
  )
}
