import { useState } from 'react'

const formatCommentTime = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function TaskComments({ comments = [], user, onAddComment }) {
  const [commentText, setCommentText] = useState('')

  const submitComment = () => {
    const text = commentText.trim()
    if (!text || !user) return

    onAddComment({
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text,
      by: user.name,
      memberId: user.id,
      at: formatCommentTime(),
      createdAt: new Date().toISOString()
    })
    setCommentText('')
  }

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {comments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comments.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '8px 10px',
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{comment.by || 'Team member'}</span>
                <span style={{ fontSize: 10, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>{comment.at || ''}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                {comment.text}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <input
          type="text"
          placeholder="Add delay, blocker, or difficulty..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitComment()}
          style={{
            minWidth: 0,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--input-bg)',
            color: 'var(--text-main)',
            fontSize: 12,
            outline: 'none'
          }}
        />
        <button
          type="button"
          onClick={submitComment}
          style={{
            padding: '8px 12px',
            background: 'var(--btn-secondary-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--btn-secondary-border)',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Comment
        </button>
      </div>
    </div>
  )
}
