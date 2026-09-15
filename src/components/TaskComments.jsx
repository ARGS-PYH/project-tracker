import { useState } from 'react'

const formatCommentTime = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function TaskComments({ comments = [], user, onAddComment }) {
  const [commentText, setCommentText] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeImageModal, setActiveImageModal] = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Please select an image under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target.result)
      setImagePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const submitComment = () => {
    const text = commentText.trim()
    if ((!text && !image) || !user) return

    onAddComment({
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text,
      by: user.name,
      memberId: user.id,
      imageUrl: image || null,
      at: formatCommentTime(),
      createdAt: new Date().toISOString()
    })
    setCommentText('')
    setImage(null)
    setImagePreview(null)
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
              {comment.text && (
                <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                  {comment.text}
                </div>
              )}
              {comment.imageUrl && (
                <div style={{ marginTop: 6 }}>
                  <img
                    src={comment.imageUrl}
                    alt="Comment attachment"
                    onClick={() => setActiveImageModal(comment.imageUrl)}
                    style={{
                      maxHeight: 120, maxWidth: '100%', borderRadius: 6,
                      border: '1px solid var(--border)', cursor: 'pointer',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment Input Box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {imagePreview && (
          <div style={{ position: 'relative', display: 'inline-block', width: 'fit-content' }}>
            <img
              src={imagePreview}
              alt="Attachment preview"
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
            />
            <button
              type="button"
              onClick={() => { setImage(null); setImagePreview(null); }}
              style={{
                position: 'absolute', top: -5, right: -5, background: '#EF4444',
                color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 6, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Add comment or status note..."
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

          <input
            type="file"
            accept="image/*"
            id="commentImageInput"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="commentImageInput"
            title="Attach Image"
            style={{
              padding: '8px 10px',
              background: 'var(--card-sub-bg)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            📷
          </label>

          <button
            type="button"
            onClick={submitComment}
            disabled={!commentText.trim() && !image}
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

      {/* Image Lightbox Modal */}
      {activeImageModal && (
        <div
          onClick={() => setActiveImageModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <img
            src={activeImageModal}
            alt="Full size view"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}
