import React, { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
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

  const submit = async event => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !canComment || !user?.uid) return
    setBusy(true)
    setError('')
    try {
      await addDoc(collection(db, 'organisations', orgId, 'projects', projectId, 'tasks', task.id, 'comments'), {
        text,
        authorUid: user.uid,
        authorName: user.displayName || user.email || 'Team member',
        createdAt: serverTimestamp()
      })
      setDraft('')
      onActivity?.('comment_added', 'Comment added to "' + task.title + '".', task.id)
    } catch {
      setError('Your comment could not be posted. Check that you have contributor access.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async comment => {
    setError('')
    try {
      await deleteDoc(doc(db, 'organisations', orgId, 'projects', projectId, 'tasks', task.id, 'comments', comment.id))
    } catch {
      setError('This comment could not be deleted.')
    }
  }

  return (
    <section className="v2-panel v2-comments-panel">
      <div className="v2-panel-heading"><div><h2>Discussion · {task.title}</h2><p>Keep decisions and context attached to the work.</p></div><span className="v2-result-count">{comments.length} comments</span></div>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {loading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading discussion…</div> : comments.length ? <div className="v2-comments-list">{comments.map(comment => <article className="v2-comment" key={comment.id}><span className="v2-avatar">{(comment.authorName || 'U').slice(0,1).toUpperCase()}</span><div className="v2-comment-body"><div><strong>{comment.authorName || 'Team member'}</strong><small>{formatDate(comment.createdAt)}</small></div><p>{comment.text}</p></div>{(comment.authorUid === user?.uid || canManage) && <button className="v2-text-button" onClick={() => remove(comment)}>Delete</button>}</article>)}</div> : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="mail" size={17}/></span><div><strong>No discussion yet</strong><p>Post a question, decision or update for the team.</p></div></div>}
      {canComment ? <form className="v2-comment-form" onSubmit={submit}><textarea value={draft} onChange={event => setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Write a comment…"/><button className="v2-button v2-button-primary" disabled={busy || !draft.trim()}>{busy ? 'Posting…' : 'Post comment'} <Icon name="arrow" size={15}/></button></form> : <p className="v2-invite-footnote">You have read-only access to this task.</p>}
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
