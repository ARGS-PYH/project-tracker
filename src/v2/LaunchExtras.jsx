import React, { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes
} from 'firebase/storage'
import { db } from '../firebase.js'
import Icon from './icons.jsx'
import { createZipBlob } from './createZip.js'
import { addDaysToDateOnly, getLaunchCountdown } from './launchDates.js'

const readinessTemplate = [
  { id: 'scope', category: 'Product', label: 'Product scope and success metrics approved', complete: false, evidence: '' },
  { id: 'functionality', category: 'Product', label: 'Critical user journeys are complete', complete: false, evidence: '' },
  { id: 'deployment', category: 'Engineering', label: 'Release candidate deployed and monitored', complete: false, evidence: '' },
  { id: 'quality', category: 'Quality', label: 'Critical and high-severity bugs resolved', complete: false, evidence: '' },
  { id: 'testing', category: 'Quality', label: 'Acceptance and regression testing passed', complete: false, evidence: '' },
  { id: 'marketing', category: 'Marketing', label: 'Launch communications and assets approved', complete: false, evidence: '' },
  { id: 'support', category: 'Operations', label: 'Customer support and escalation process ready', complete: false, evidence: '' },
  { id: 'signoff', category: 'Leadership', label: 'Launch owner has given final approval', complete: false, evidence: '' }
]

function formatDate(value) {
  if (!value) return 'Just now'
  const date = typeof value === 'string' ? new Date(value) : value?.toDate?.()
  if (!date || Number.isNaN(date.getTime())) return 'Just now'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export function TaskEditor({ task, milestones, members, tasks, onSave, onCancel, busy }) {
  const [values, setValues] = useState({})
  const [subtaskTitle, setSubtaskTitle] = useState('')
  useEffect(() => {
    setValues({
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      dueDate: typeof task?.dueDate === 'string' ? task.dueDate : '',
      milestoneId: task?.milestoneId || '',
      assigneeUid: task?.assignedToUid || '',
      subtasks: Array.isArray(task?.subtasks) ? task.subtasks : [],
      dependsOn: Array.isArray(task?.dependsOn) ? task.dependsOn : []
    })
    setSubtaskTitle('')
  }, [task?.id])

  const set = (key, value) => setValues(current => ({ ...current, [key]: value }))
  const addSubtask = () => {
    const title = subtaskTitle.trim()
    if (!title) return
    set('subtasks', [...(values.subtasks || []), { id: String(Date.now()), title, complete: false }])
    setSubtaskTitle('')
  }
  const submit = event => {
    event.preventDefault()
    onSave(values)
  }

  return (
    <form className="v2-inline-create v2-task-edit-form" onSubmit={submit}>
      <div className="v2-inline-create-heading"><strong>Edit task</strong><span>Update the task details, owner and delivery status.</span></div>
      <label className="v2-field"><span>Task title *</span><input value={values.title || ''} onChange={event => set('title', event.target.value)} required minLength={2} maxLength={140}/></label>
      <label className="v2-field"><span>Description</span><textarea value={values.description || ''} onChange={event => set('description', event.target.value)} maxLength={1500} rows={3}/></label>
      <div className="v2-form-grid">
        <label className="v2-field"><span>Status</span><select value={values.status || 'todo'} onChange={event => set('status', event.target.value)}>{['todo','in_progress','in_review','blocked','done'].map(value => <option key={value} value={value}>{value.replace('_',' ')}</option>)}</select></label>
        <label className="v2-field"><span>Priority</span><select value={values.priority || 'medium'} onChange={event => set('priority', event.target.value)}>{['low','medium','high','urgent'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="v2-field"><span>Due date</span><input type="date" value={values.dueDate || ''} onChange={event => set('dueDate', event.target.value)}/></label>
        <label className="v2-field"><span>Milestone</span><select value={values.milestoneId || ''} onChange={event => set('milestoneId', event.target.value)}><option value="">No milestone</option>{milestones.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="v2-field"><span>Assignee</span><select value={values.assigneeUid || ''} onChange={event => set('assigneeUid', event.target.value)}><option value="">Unassigned</option>{members.map(member => <option key={member.id} value={member.id}>{member.displayName || member.email || member.id}</option>)}</select></label>
      </div>
      <div className="v2-subtask-editor">
        <div className="v2-subtask-heading"><strong>Task dependencies</strong><span>Complete these tasks first</span></div>
        {tasks.filter(item => item.id !== task?.id).length ? tasks.filter(item => item.id !== task?.id).map(item => <label className="v2-dependency-edit-row" key={item.id}>
          <input type="checkbox" checked={(values.dependsOn || []).includes(item.id)} onChange={event => set('dependsOn', event.target.checked ? [...(values.dependsOn || []), item.id] : (values.dependsOn || []).filter(id => id !== item.id))}/>
          <span><strong>{item.title}</strong><small>{item.status || 'todo'} · {item.priority || 'medium'} priority</small></span>
        </label>) : <p className="v2-invite-footnote">Add another task before setting a dependency.</p>}
      </div>
      <div className="v2-subtask-editor">
        <div className="v2-subtask-heading"><strong>Subtasks</strong><span>{(values.subtasks || []).filter(item => item.complete).length} of {(values.subtasks || []).length} complete</span></div>
        {(values.subtasks || []).map((item, index) => <div className="v2-subtask-edit-row" key={item.id || index}>
          <label><input type="checkbox" checked={Boolean(item.complete)} onChange={event => set('subtasks', (values.subtasks || []).map((entry, itemIndex) => itemIndex === index ? {...entry, complete:event.target.checked} : entry))}/><span>{item.title}</span></label>
          <button type="button" className="v2-text-button" onClick={() => set('subtasks', (values.subtasks || []).filter((entry, itemIndex) => itemIndex !== index))}>Remove</button>
        </div>)}
        <div className="v2-subtask-add-row"><input value={subtaskTitle} onChange={event => setSubtaskTitle(event.target.value)} maxLength={100} placeholder="Add a smaller step…"/><button type="button" className="v2-button v2-button-secondary" onClick={addSubtask} disabled={!subtaskTitle.trim()}>Add step</button></div>
      </div>
      <div className="v2-form-actions">
        <button type="button" className="v2-button v2-button-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="v2-button v2-button-primary" disabled={busy || (values.title || '').trim().length < 2}>{busy ? 'Saving…' : 'Save task'} <Icon name="check" size={15}/></button>
      </div>
    </form>
  )
}

export function ProjectSettingsPanel({ project, canManage, onSave, busy }) {
  const [name, setName] = useState(project.name || '')
  const [description, setDescription] = useState(project.description || '')
  const [targetLaunchDate, setTargetLaunchDate] = useState(typeof project.targetLaunchDate === 'string' ? project.targetLaunchDate : '')
  useEffect(() => {
    setName(project.name || '')
    setDescription(project.description || '')
    setTargetLaunchDate(typeof project.targetLaunchDate === 'string' ? project.targetLaunchDate : '')
  }, [project.id, project.name, project.description, project.targetLaunchDate])

  const submit = event => {
    event.preventDefault()
    onSave({ name, description, targetLaunchDate })
  }

  return (
    <section className="v2-panel v2-project-settings-panel">
      <div className="v2-panel-heading"><div><h2>Launch profile</h2><p>Keep the launch name, brief and target date current for everyone on the team.</p></div><span className="v2-panel-icon"><Icon name="settings" size={18}/></span></div>
      <form className="v2-launch-form" onSubmit={submit}>
        <label className="v2-field"><span>Launch name *</span><input value={name} onChange={event => setName(event.target.value)} minLength={3} maxLength={100} required disabled={!canManage}/></label>
        <label className="v2-field"><span>Launch brief</span><textarea value={description} onChange={event => setDescription(event.target.value)} rows={5} maxLength={2000} disabled={!canManage} placeholder="What is being launched, who is it for and what does success look like?"/></label>
        <label className="v2-field"><span>Target launch date</span><input type="date" value={targetLaunchDate} onChange={event => setTargetLaunchDate(event.target.value)} disabled={!canManage}/></label>
        {canManage ? <div className="v2-form-actions"><span className="v2-invite-footnote">Changes are shared with everyone who has access to this launch.</span><button className="v2-button v2-button-primary" disabled={busy || name.trim().length < 3}>{busy ? 'Saving…' : 'Save launch settings'} <Icon name="check" size={15}/></button></div> : <p className="v2-invite-footnote">Only a project manager or organisation administrator can edit launch settings.</p>}
      </form>
    </section>
  )
}

export function ReadinessPanel({ project, canManage, onSave, busy }) {
  const [checks, setChecks] = useState(project.readinessChecks?.length ? project.readinessChecks : readinessTemplate)
  useEffect(() => {
    setChecks(project.readinessChecks?.length ? project.readinessChecks : readinessTemplate)
  }, [project.id, project.readinessChecks])

  const completed = checks.filter(item => item.complete).length
  const percent = checks.length ? Math.round(completed / checks.length * 100) : 0
  const categories = [...new Set(checks.map(item => item.category))]
  const grouped = useMemo(() => categories.map(category => ({
    category,
    items: checks.filter(item => item.category === category)
  })), [categories.join('|'), checks])

  const update = (id, patch) => setChecks(current => current.map(item => item.id === id ? { ...item, ...patch } : item))

  return (
    <section className="v2-panel v2-readiness-panel">
      <div className="v2-readiness-summary">
        <div className="v2-readiness-score"><strong>{percent}%</strong><span>ready</span></div>
        <div className="v2-readiness-copy"><h2>Launch readiness</h2><p>{completed} of {checks.length} checks completed. A launch should only go live when the accountable owners have verified the evidence.</p><div className="v2-progress-track"><span style={{width: percent + '%'}}/></div></div>
      </div>
      {grouped.map(group => <div className="v2-readiness-group" key={group.category}>
        <h3>{group.category}</h3>
        {group.items.map(item => <div className="v2-readiness-item" key={item.id}>
          <label className="v2-readiness-check"><input type="checkbox" checked={Boolean(item.complete)} disabled={!canManage} onChange={event => update(item.id, {complete:event.target.checked})}/><span><strong>{item.label}</strong><small>{item.complete ? 'Verified' : 'Awaiting confirmation'}</small></span></label>
          {canManage && <input className="v2-readiness-evidence" value={item.evidence || ''} onChange={event => update(item.id, {evidence:event.target.value})} placeholder="Evidence or approval reference (optional)"/>}
          {!canManage && item.evidence && <span className="v2-readiness-evidence-text">{item.evidence}</span>}
        </div>)}
      </div>)}
      {canManage && <div className="v2-form-actions"><span className="v2-invite-footnote">Readiness is a decision aid; the launch owner remains accountable for the final go-live decision.</span><button className="v2-button v2-button-primary" onClick={() => onSave(checks)} disabled={busy}>{busy ? 'Saving…' : 'Save readiness'} <Icon name="check" size={15}/></button></div>}
    </section>
  )
}

export function TaskCommentsPanel({ orgId, projectId, task, user, canComment, canManage, onActivity }) {
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orgId || !projectId || !task?.id) {
      setComments([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    const commentsRef = collection(db, 'organisations', orgId, 'projects', projectId, 'tasks', task.id, 'comments')
    const unsubscribe = onSnapshot(commentsRef, snapshot => {
      setComments(snapshot.docs.map(item => ({id:item.id, ...item.data()})).sort((a,b) => {
        const first = a.createdAt?.toMillis?.() || 0
        const second = b.createdAt?.toMillis?.() || 0
        return first - second
      }))
      setLoading(false)
    }, () => {
      setError('Comments could not be loaded. Confirm that you can access this task.')
      setLoading(false)
    })
    return unsubscribe
  }, [orgId, projectId, task?.id])

  useEffect(() => {
    const previews = selectedImages.map(file => ({ file, url: URL.createObjectURL(file) }))
    setImagePreviews(previews)
    return () => previews.forEach(item => URL.revokeObjectURL(item.url))
  }, [selectedImages])

  const chooseImages = event => {
    const incoming = Array.from(event.target.files || [])
    event.target.value = ''
    if (!incoming.length) return

    const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    const accepted = []
    for (const file of incoming) {
      if (!imageTypes.has(file.type)) {
        setError('Use JPG, PNG, WEBP or GIF images.')
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(file.name + ' is larger than 5 MB. Choose a smaller image.')
        continue
      }
      accepted.push(file)
    }

    setSelectedImages(current => {
      const remaining = Math.max(0, 4 - current.length)
      if (accepted.length > remaining) {
        setError('You can attach up to 4 images to one comment.')
      }
      return [...current, ...accepted.slice(0, remaining)]
    })
  }

  const removeSelectedImage = index => {
    setSelectedImages(current => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const submit = async event => {
    event.preventDefault()
    const text = draft.trim()
    if ((!text && !selectedImages.length) || !canComment || !user?.uid || busy) return

    setBusy(true)
    setError('')
    let commentRef = null
    const uploadedAttachments = []
    let uploadFailed = false

    try {
      commentRef = await addDoc(collection(db, 'organisations', orgId, 'projects', projectId, 'tasks', task.id, 'comments'), {
        text,
        attachments: [],
        authorUid: user.uid,
        authorName: user.displayName || user.email || 'Team member',
        createdAt: serverTimestamp()
      })

      for (let index = 0; index < selectedImages.length; index += 1) {
        const file = selectedImages[index]
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'image'
        const path = 'organisations/' + orgId + '/projects/' + projectId
          + '/comment-attachments/' + task.id + '/' + commentRef.id
          + '/' + Date.now() + '-' + index + '-' + safeName

        try {
          const uploaded = await uploadBytes(storageRef(getStorage(), path), file, { contentType: file.type })
          const downloadURL = await getDownloadURL(uploaded.ref)
          uploadedAttachments.push({
            name: file.name,
            storagePath: path,
            downloadURL,
            contentType: file.type,
            size: file.size
          })
        } catch (uploadError) {
          console.warn('PLTK comment image upload failed:', uploadError?.code || uploadError)
          uploadFailed = true
          break
        }
      }

      if (uploadedAttachments.length) {
        await updateDoc(commentRef, { attachments: uploadedAttachments })
      } else if (!text) {
        await deleteDoc(commentRef)
      }

      setDraft('')
      setSelectedImages([])
      onActivity?.(
        'comment_added',
        uploadedAttachments.length
          ? 'Comment with ' + uploadedAttachments.length + ' image(s) added to "' + task.title + '".'
          : 'Comment added to "' + task.title + '".',
        task.id
      )

      if (uploadFailed) {
        setError(
          uploadedAttachments.length
            ? 'Your comment was posted, but one or more images could not be uploaded. Check Firebase Storage and its rules.'
            : 'Your comment text was posted, but the image could not be uploaded. Check Firebase Storage and its rules.'
        )
      }
    } catch (submitError) {
      console.warn('PLTK task comment submission failed:', submitError?.code || submitError)
      if (uploadedAttachments.length) {
        await Promise.allSettled(uploadedAttachments.map(item =>
          deleteObject(storageRef(getStorage(), item.storagePath))
        ))
      }
      setError('Your comment could not be completed. Check your project access and Firebase Storage configuration.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async comment => {
    setError('')
    try {
      const attachments = Array.isArray(comment.attachments) ? comment.attachments : []
      await Promise.all(attachments.filter(item => item.storagePath).map(item =>
        deleteObject(storageRef(getStorage(), item.storagePath)).catch(removeError => {
          if (removeError?.code !== 'storage/object-not-found') throw removeError
        })
      ))
      await deleteDoc(doc(db, 'organisations', orgId, 'projects', projectId, 'tasks', task.id, 'comments', comment.id))
    } catch (removeError) {
      console.warn('PLTK comment deletion failed:', removeError?.code || removeError)
      setError('This comment or one of its images could not be deleted. Check your project access and Storage rules.')
    }
  }

  return (
    <section className="v2-panel v2-comments-panel">
      <div className="v2-panel-heading"><div><h2>Discussion · {task.title}</h2><p>Keep decisions, complaints and supporting screenshots attached to the work.</p></div><span className="v2-result-count">{comments.length} comments</span></div>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {loading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading discussion…</div> : comments.length ? (
        <div className="v2-comments-list">
          {comments.map(comment => (
            <article className="v2-comment" key={comment.id}>
              <span className="v2-avatar">{(comment.authorName || 'U').slice(0,1).toUpperCase()}</span>
              <div className="v2-comment-body">
                <div><strong>{comment.authorName || 'Team member'}</strong><small>{formatDate(comment.createdAt)}</small></div>
                {comment.text && <p>{comment.text}</p>}
                {Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                  <div className="v2-comment-attachments">
                    {comment.attachments.map((attachment, index) => (
                      <a
                        className="v2-comment-attachment"
                        href={attachment.downloadURL}
                        target="_blank"
                        rel="noreferrer"
                        key={attachment.storagePath || attachment.downloadURL || index}
                        title={attachment.name || 'Open attachment'}
                      >
                        <img src={attachment.downloadURL} alt={attachment.name || 'Comment attachment'} loading="lazy"/>
                        <span>{attachment.name || 'Image attachment'}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {(comment.authorUid === user?.uid || canManage) && <button type="button" className="v2-text-button" onClick={() => remove(comment)}>Delete</button>}
            </article>
          ))}
        </div>
      ) : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="mail" size={17}/></span><div><strong>No discussion yet</strong><p>Post a question, decision or update for the team. You can include screenshots as evidence.</p></div></div>}
      {canComment ? (
        <form className="v2-comment-composer" onSubmit={submit}>
          <textarea value={draft} onChange={event => setDraft(event.target.value)} rows={3} maxLength={2000} placeholder="Describe the issue, complaint or update…"/>
          {imagePreviews.length > 0 && (
            <div className="v2-comment-preview-list">
              {imagePreviews.map((item, index) => (
                <div className="v2-comment-preview" key={item.file.name + ':' + item.file.lastModified + ':' + index}>
                  <img src={item.url} alt={'Selected attachment ' + (index + 1)}/>
                  <button type="button" onClick={() => removeSelectedImage(index)} aria-label={'Remove ' + item.file.name} disabled={busy}>×</button>
                  <span>{item.file.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="v2-comment-composer-actions">
            <label className="v2-button v2-button-secondary v2-comment-attach-button">
              <Icon name="paperclip" size={15}/> Add images
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={chooseImages} disabled={busy || selectedImages.length >= 4}/>
            </label>
            <span className="v2-comment-attachment-hint">JPG, PNG, WEBP or GIF · Max 5 MB each · Up to 4 images</span>
            <button className="v2-button v2-button-primary" disabled={busy || (!draft.trim() && !selectedImages.length)}>
              {busy ? 'Posting…' : 'Post comment'} <Icon name="arrow" size={15}/>
            </button>
          </div>
        </form>
      ) : <p className="v2-invite-footnote">You have read-only access to this task.</p>}
    </section>
  )
}

const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', 'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])

export function ProjectFilesPanel({ orgId, projectId, user, canUpload, canDelete, onActivity }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!orgId || !projectId) return undefined
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, 'organisations', orgId, 'projects', projectId, 'files'), snapshot => {
      setFiles(snapshot.docs.map(item => ({id:item.id, ...item.data()})).sort((a,b) => {
        const first = a.createdAt?.toMillis?.() || 0
        const second = b.createdAt?.toMillis?.() || 0
        return second - first
      }))
      setLoading(false)
    }, () => {
      setError('Files could not be loaded. Check project access and the Storage rules.')
      setLoading(false)
    })
    return unsubscribe
  }, [orgId, projectId])

  const upload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !canUpload || !user?.uid) return
    setError('')
    setNotice('')
    if (file.size > 10 * 1024 * 1024) {
      setError('Files must be 10 MB or smaller.')
      return
    }
    if (!allowedTypes.has(file.type)) {
      setError('This file type is not supported. Use an image, PDF, text file, ZIP, DOCX or XLSX.')
      return
    }
    setBusy(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'attachment'
      const path = 'organisations/' + orgId + '/projects/' + projectId + '/' + Date.now() + '-' + safeName
      const target = storageRef(getStorage(), path)
      const uploaded = await uploadBytes(target, file, {contentType:file.type})
      const downloadURL = await getDownloadURL(uploaded.ref)
      await addDoc(collection(db, 'organisations', orgId, 'projects', projectId, 'files'), {
        name: file.name,
        storagePath: path,
        downloadURL,
        contentType: file.type,
        size: file.size,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || user.email || 'Team member',
        createdAt: serverTimestamp()
      })
      setNotice('File uploaded.')
      onActivity?.('file_uploaded', 'Uploaded "' + file.name + '".', '')
    } catch {
      setError('Upload failed. Confirm your project role and that Firebase Storage is enabled.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async file => {
    if (!canDelete) return
    setError('')
    try {
      if (file.storagePath) await deleteObject(storageRef(getStorage(), file.storagePath))
      await deleteDoc(doc(db, 'organisations', orgId, 'projects', projectId, 'files', file.id))
      setNotice('File deleted.')
    } catch {
      setError('File could not be deleted. It may already have been removed from Storage.')
    }
  }

  return (
    <section className="v2-panel v2-files-panel">
      <div className="v2-panel-heading"><div><h2>Launch files</h2><p>Share approved assets, briefs, release notes and supporting documents.</p></div>{canUpload && <label className="v2-button v2-button-primary v2-upload-button">{busy ? 'Uploading…' : 'Upload file'} <Icon name="plus" size={15}/><input type="file" hidden onChange={upload} disabled={busy}/></label>}</div>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {notice && <div className="v2-alert v2-alert-success">{notice}</div>}
      {loading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading files…</div> : files.length ? <div className="v2-files-list">{files.map(file => <article className="v2-file-row" key={file.id}><span className="v2-file-icon"><Icon name="folder" size={17}/></span><div className="v2-file-info"><strong>{file.name}</strong><small>{file.uploadedByName || 'Team member'} · {Math.max(1, Math.round((file.size || 0) / 1024))} KB · {formatDate(file.createdAt)}</small></div><a className="v2-inline-link" href={file.downloadURL} target="_blank" rel="noreferrer">Open <Icon name="arrow" size={14}/></a>{canDelete && <button className="v2-text-button" onClick={() => remove(file)}>Delete</button>}</article>)}</div> : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="folder" size={17}/></span><div><strong>No files shared yet</strong><p>Upload project documents or approved launch assets (up to 10 MB each).</p></div></div>}
      {!canUpload && <p className="v2-invite-footnote">You have read-only access to launch files.</p>}
    </section>
  )
}

export function ProjectActivityPanel({ items }) {
  return (
    <section className="v2-panel v2-activity-panel">
      <div className="v2-panel-heading"><div><h2>Launch activity</h2><p>A timeline of changes and collaboration on this launch.</p></div><span className="v2-result-count">{items.length} events</span></div>
      {items.length ? <div className="v2-activity-list">{items.map(item => <article className="v2-activity-row" key={item.id}><span className="v2-list-empty-icon"><Icon name="clock" size={16}/></span><div><strong>{item.message || 'Workspace update'}</strong><small>{item.actorName || 'Team member'} · {formatDate(item.createdAt)}</small></div></article>)}</div> : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="clock" size={17}/></span><div><strong>No activity recorded yet</strong><p>Task, comment and file updates will appear here.</p></div></div>}
    </section>
  )
}

export function LaunchCountdown({ targetDate, compact = false }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])
  const countdown = getLaunchCountdown(targetDate, now)
  return (
    <div className={'v2-launch-countdown ' + (compact ? 'compact ' : '') + 'is-' + countdown.kind} aria-live="polite">
      <Icon name="clock" size={compact ? 13 : 17}/>
      <span>{countdown.label}</span>
    </div>
  )
}

export function DeadlineExtensionPanel({ project, orgId, projectId, user, canManage }) {
  const countdown = getLaunchCountdown(project?.targetLaunchDate)
  const [days, setDays] = useState('7')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async event => {
    event.preventDefault()
    const extensionDays = Number(days)
    if (!Number.isInteger(extensionDays) || extensionDays < 1 || extensionDays > 365) {
      setError('Choose between 1 and 365 extra days.')
      return
    }
    let nextDate
    try {
      nextDate = addDaysToDateOnly(project.targetLaunchDate, extensionDays)
    } catch {
      setError('Set a valid target launch date before extending the deadline.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const history = Array.isArray(project.deadlineExtensions) ? project.deadlineExtensions : []
      await updateDoc(doc(db, 'organisations', orgId, 'projects', projectId), {
        targetLaunchDate: nextDate,
        deadlineExtensions: [
          ...history.slice(-19),
          {
            previousDate: project.targetLaunchDate,
            newDate: nextDate,
            days: extensionDays,
            extendedBy: user.uid,
            extendedByName: user.displayName || user.email || 'Project manager',
            extendedAt: new Date().toISOString()
          }
        ],
        updatedAt: serverTimestamp()
      })
      setNotice('Launch deadline extended to ' + nextDate + '.')
    } catch (saveError) {
      console.warn('PLTK deadline extension failed:', saveError?.code || saveError)
      setError('The new deadline could not be saved. Confirm your project manager access.')
    } finally {
      setBusy(false)
    }
  }

  if (project?.status === 'launched' || countdown.kind !== 'overdue') return null

  return (
    <section className="v2-panel v2-deadline-panel">
      <div className="v2-panel-heading">
        <div>
          <span className="v2-eyebrow">TARGET DATE PASSED</span>
          <h2>Do you need more time?</h2>
          <p>This launch is {countdown.days} {countdown.days === 1 ? 'day' : 'days'} past its target date. How many additional days should be added?</p>
        </div>
        <span className="v2-panel-icon overdue"><Icon name="clock" size={18}/></span>
      </div>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {notice && <div className="v2-alert v2-alert-success">{notice}</div>}
      {canManage ? (
        <form className="v2-deadline-form" onSubmit={submit}>
          <label className="v2-field">
            <span>Additional days</span>
            <input type="number" min="1" max="365" step="1" value={days} onChange={event => setDays(event.target.value)} required/>
          </label>
          <button className="v2-button v2-button-primary" disabled={busy || !days || Number(days) < 1 || Number(days) > 365}>
            {busy ? 'Extending…' : 'Extend launch deadline'} <Icon name="arrow" size={15}/>
          </button>
        </form>
      ) : <p className="v2-invite-footnote">Ask your project manager to confirm how many extra days are needed.</p>}
      {Array.isArray(project.deadlineExtensions) && project.deadlineExtensions.length > 0 && (
        <p className="v2-deadline-history">Previous extensions: {project.deadlineExtensions.length}</p>
      )}
    </section>
  )
}

function archiveSafeName(value, fallback = 'file') {
  const name = String(value || fallback).replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, ' ').trim()
  return name.slice(0, 120) || fallback
}

function timestampToText(value) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value?.toDate?.()
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : ''
}

async function fetchArchiveEntry(url, name) {
  if (!url) throw new Error(name + ' has no download URL.')
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not download "' + name + '" for the archive (HTTP ' + response.status + ').')
  return new Uint8Array(await response.arrayBuffer())
}

export function LaunchCloseoutPanel({ project, orgId, projectId, user, canManage }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const isLaunched = project?.status === 'launched'

  const downloadArchive = async () => {
    if (!isLaunched || !canManage || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const base = ['organisations', orgId, 'projects', projectId]
      const [fileSnapshot, taskSnapshot, milestoneSnapshot] = await Promise.all([
        getDocs(collection(db, ...base, 'files')),
        getDocs(collection(db, ...base, 'tasks')),
        getDocs(collection(db, ...base, 'milestones'))
      ])
      const tasks = taskSnapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      const discussionSnapshots = await Promise.all(tasks.map(task =>
        getDocs(collection(db, ...base, 'tasks', task.id, 'comments'))
      ))

      const archiveEntries = []
      const discussionLines = []
      const downloadedFiles = []
      const downloadedImages = []
      const projectFolder = archiveSafeName(project.name, 'PLTK launch')

      for (const fileDoc of fileSnapshot.docs) {
        const file = fileDoc.data()
        const fileName = archiveSafeName(file.name, 'launch-file')
        const archiveName = projectFolder + '/Launch files/' + fileName
        archiveEntries.push({ name: archiveName, bytes: await fetchArchiveEntry(file.downloadURL, file.name || fileName) })
        downloadedFiles.push({ name: file.name || fileName, archivePath: archiveName, size: file.size || 0 })
      }

      for (let taskIndex = 0; taskIndex < tasks.length; taskIndex += 1) {
        const task = tasks[taskIndex]
        const comments = discussionSnapshots[taskIndex].docs.map(item => ({ id: item.id, ...item.data() }))
          .sort((a, b) => timestampToText(a.createdAt).localeCompare(timestampToText(b.createdAt)))
        const taskFolder = archiveSafeName(task.title, 'task') + '-' + task.id.slice(0, 8)
        discussionLines.push('TASK: ' + task.title + '\n' + (task.description || '') + '\n')
        for (const comment of comments) {
          discussionLines.push('[' + timestampToText(comment.createdAt) + '] ' + (comment.authorName || 'Team member') + ':\n' + (comment.text || '[Image-only comment]') + '\n')
          const attachments = Array.isArray(comment.attachments) ? comment.attachments : []
          for (let attachmentIndex = 0; attachmentIndex < attachments.length; attachmentIndex += 1) {
            const attachment = attachments[attachmentIndex]
            const fileName = archiveSafeName(attachment.name, 'comment-image-' + (attachmentIndex + 1))
            const archiveName = projectFolder + '/Task evidence/' + taskFolder + '/' + comment.id.slice(0, 8) + '-' + (attachmentIndex + 1) + '-' + fileName
            archiveEntries.push({ name: archiveName, bytes: await fetchArchiveEntry(attachment.downloadURL, attachment.name || fileName) })
            downloadedImages.push({ task: task.title, name: attachment.name || fileName, archivePath: archiveName, size: attachment.size || 0 })
            discussionLines.push('  Image: ' + archiveName)
          }
        }
        discussionLines.push('')
      }

      const milestones = milestoneSnapshot.docs.map(item => {
        const data = item.data()
        return { id: item.id, title: data.title || '', description: data.description || '', dueDate: data.dueDate || null, status: data.status || 'not_started' }
      })
      const manifest = {
        product: 'PLTK — Product Launch Tracker',
        organisationId: orgId,
        projectId,
        launch: {
          name: project.name,
          description: project.description || '',
          status: project.status,
          targetLaunchDate: project.targetLaunchDate || null,
          launchedAt: timestampToText(project.launchedAt) || null,
          createdAt: timestampToText(project.createdAt) || null
        },
        exportedAt: new Date().toISOString(),
        taskCount: tasks.length,
        completedTaskCount: tasks.filter(task => task.status === 'done').length,
        milestoneCount: milestones.length,
        files: downloadedFiles,
        commentImages: downloadedImages,
        milestones
      }

      archiveEntries.push({
        name: projectFolder + '/Launch manifest.json',
        bytes: new TextEncoder().encode(JSON.stringify(manifest, null, 2))
      })
      archiveEntries.push({
        name: projectFolder + '/Task discussions.txt',
        bytes: new TextEncoder().encode(discussionLines.join('\n') || 'No task discussions were recorded.')
      })

      const zip = createZipBlob(archiveEntries)
      const downloadUrl = URL.createObjectURL(zip)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = archiveSafeName(project.name, 'PLTK-launch') + '-closeout.zip'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000)

      setNotice('Archive prepared: ' + downloadedFiles.length + ' project file(s), ' + downloadedImages.length + ' comment image(s), plus launch notes and manifest.')
      try {
        await updateDoc(doc(db, ...base), {
          closeoutExportedAt: serverTimestamp(),
          closeoutExportedBy: user.uid,
          closeoutExportFileCount: archiveEntries.length,
          updatedAt: serverTimestamp()
        })
      } catch (exportLogError) {
        console.warn('PLTK close-out export log could not be saved:', exportLogError?.code || exportLogError)
      }
    } catch (archiveError) {
      console.error('PLTK close-out archive failed:', archiveError)
      setError(archiveError.message || 'The launch archive could not be created. Check project and Storage access.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="v2-panel v2-closeout-panel">
      <div className="v2-panel-heading">
        <div>
          <span className="v2-eyebrow">LAUNCH CLOSE-OUT</span>
          <h2>Download the project archive</h2>
          <p>Collect launch files, complaint screenshots, task discussions and a project manifest into one ZIP folder.</p>
        </div>
        <span className="v2-panel-icon"><Icon name="archive" size={18}/></span>
      </div>
      {!isLaunched && <div className="v2-alert v2-alert-success">The archive becomes available once this launch is marked as launched.</div>}
      {isLaunched && canManage && (
        <div className="v2-closeout-action">
          <div><strong>Everything in one package</strong><p>Project files and task-comment images are fetched from Firebase Storage and bundled in your browser.</p></div>
          <button className="v2-button v2-button-primary" onClick={downloadArchive} disabled={busy}>
            {busy ? 'Preparing ZIP…' : 'Download close-out ZIP'} <Icon name="download" size={16}/>
          </button>
        </div>
      )}
      {isLaunched && !canManage && <p className="v2-invite-footnote">Only the project manager or an organisation administrator can export the final launch archive.</p>}
      {project.closeoutExportedAt && <p className="v2-closeout-history">Last archive prepared {timestampToText(project.closeoutExportedAt) || 'previously'} by {project.closeoutExportedBy === user?.uid ? 'you' : 'a workspace manager'}.</p>}
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {notice && <div className="v2-alert v2-alert-success">{notice}</div>}
    </section>
  )
}
