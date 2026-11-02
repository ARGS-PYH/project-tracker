import React, { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import Icon from './icons.jsx'

const taskStatuses = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' }
]

const priorities = ['low', 'medium', 'high', 'urgent']

function formatDate(value) {
  if (!value) return 'No due date'
  const date = typeof value === 'string' ? new Date(value + 'T12:00:00') : value?.toDate?.()
  if (!date || Number.isNaN(date.getTime())) return 'No due date'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function StatusPill({ value }) {
  const status = taskStatuses.find(item => item.value === value) || taskStatuses[0]
  return <span className={'v2-task-status status-' + status.value}>{status.label}</span>
}

function TaskRow({ task, onStatusChange }) {
  return (
    <div className="v2-task-row">
      <div className="v2-task-main">
        <span className={'v2-task-check ' + (task.status === 'done' ? 'done' : '')}>{task.status === 'done' && <Icon name="check" size={13}/>}</span>
        <div className="v2-task-copy">
          <strong>{task.title}</strong>
          {task.description && <p>{task.description}</p>}
          <div className="v2-task-meta"><span><Icon name="calendar" size={12}/>{formatDate(task.dueDate)}</span><span className={'v2-priority priority-' + (task.priority || 'medium')}>{task.priority || 'medium'} priority</span></div>
        </div>
      </div>
      <div className="v2-task-controls">
        <StatusPill value={task.status}/>
        <select aria-label={'Update status for ' + task.title} value={task.status || 'todo'} onChange={event => onStatusChange(task.id, event.target.value)}>
          {taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
      </div>
    </div>
  )
}

function TaskForm({ milestones, onCreate, busy }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [milestoneId, setMilestoneId] = useState('')

  const submit = async event => {
    event.preventDefault()
    await onCreate({ title, description, priority, dueDate, milestoneId })
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setMilestoneId('')
  }

  return (
    <form className="v2-inline-create" onSubmit={submit}>
      <div className="v2-inline-create-heading"><strong>Create a task</strong><span>Give the work a clear owner and deadline.</span></div>
      <label className="v2-field"><span>Task title *</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={140} minLength={2} required placeholder="e.g. Complete product QA checklist"/></label>
      <label className="v2-field"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1500} rows={2} placeholder="Add context or a definition of done."/></label>
      <div className="v2-form-grid">
        <label className="v2-field"><span>Priority</span><select value={priority} onChange={e => setPriority(e.target.value)}>{priorities.map(value => <option key={value} value={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}</select></label>
        <label className="v2-field"><span>Due date</span><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/></label>
        <label className="v2-field"><span>Milestone</span><select value={milestoneId} onChange={e => setMilestoneId(e.target.value)}><option value="">No milestone</option>{milestones.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      </div>
      <div className="v2-form-actions"><button className="v2-button v2-button-primary" disabled={busy || title.trim().length < 2}>{busy ? 'Saving task…' : 'Add task'} <Icon name="plus" size={15}/></button></div>
    </form>
  )
}

function MilestoneForm({ onCreate, busy }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const submit = async event => {
    event.preventDefault()
    await onCreate({ title, description, dueDate })
    setTitle('')
    setDescription('')
    setDueDate('')
  }

  return (
    <form className="v2-inline-create" onSubmit={submit}>
      <div className="v2-inline-create-heading"><strong>Create a milestone</strong><span>Define an important deliverable in the launch plan.</span></div>
      <label className="v2-field"><span>Milestone name *</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} minLength={2} required placeholder="e.g. Product testing approved"/></label>
      <label className="v2-field"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1200} rows={2} placeholder="What must be true before this milestone is complete?"/></label>
      <label className="v2-field"><span>Target date</span><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/></label>
      <div className="v2-form-actions"><button className="v2-button v2-button-primary" disabled={busy || title.trim().length < 2}>{busy ? 'Saving milestone…' : 'Add milestone'} <Icon name="plus" size={15}/></button></div>
    </form>
  )
}

function MilestoneCard({ milestone, tasks }) {
  const related = tasks.filter(task => task.milestoneId === milestone.id)
  const completed = related.filter(task => task.status === 'done').length
  const percent = related.length ? Math.round(completed / related.length * 100) : 0
  return (
    <article className="v2-milestone-card">
      <div className="v2-milestone-card-top"><span className="v2-milestone-icon"><Icon name="flag" size={17}/></span><span className="v2-result-count">{formatDate(milestone.dueDate)}</span></div>
      <strong>{milestone.title}</strong>
      {milestone.description && <p>{milestone.description}</p>}
      <div className="v2-launch-progress"><div className="v2-launch-progress-label"><span>{completed} of {related.length} linked tasks complete</span><strong>{percent}%</strong></div><div className="v2-progress-track"><span style={{width: percent + '%'}}/></div></div>
    </article>
  )
}

export default function LaunchWorkspacePage() {
  const { projectId } = useParams()
  const { selectedOrgId, projects, projectsLoading } = useWorkspace()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const project = projects.find(item => item.id === projectId)

  useEffect(() => {
    if (!selectedOrgId || !projectId) {
      setLoading(false)
      setTasks([])
      setMilestones([])
      return undefined
    }
    setLoading(true)
    let tasksReady = false
    let milestonesReady = false
    const finishIfReady = () => {
      if (tasksReady && milestonesReady) setLoading(false)
    }
    const tasksRef = collection(db, 'organisations', selectedOrgId, 'projects', projectId, 'tasks')
    const milestonesRef = collection(db, 'organisations', selectedOrgId, 'projects', projectId, 'milestones')
    const unsubTasks = onSnapshot(tasksRef, snapshot => {
      setTasks(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')))
      tasksReady = true
      finishIfReady()
    }, () => {
      setError('Tasks could not be loaded. Confirm your project access and try again.')
      tasksReady = true
      finishIfReady()
    })
    const unsubMilestones = onSnapshot(milestonesRef, snapshot => {
      setMilestones(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')))
      milestonesReady = true
      finishIfReady()
    }, () => {
      setError('Milestones could not be loaded. Confirm your project access and try again.')
      milestonesReady = true
      finishIfReady()
    })
    return () => {
      unsubTasks()
      unsubMilestones()
    }
  }, [selectedOrgId, projectId])

  const filteredTasks = useMemo(() => tasks.filter(task => statusFilter === 'all' || task.status === statusFilter), [tasks, statusFilter])
  const completedCount = tasks.filter(task => task.status === 'done').length
  const blockedCount = tasks.filter(task => task.status === 'blocked').length
  const progress = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0

  const createTask = async values => {
    if (!project || !user?.uid) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await addDoc(collection(db, 'organisations', selectedOrgId, 'projects', projectId, 'tasks'), {
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        status: 'todo',
        priority: values.priority,
        dueDate: values.dueDate || null,
        milestoneId: values.milestoneId || null,
        assigneeUids: [user.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      setNotice('Task added to the launch.')
    } catch {
      setError('Task could not be created. Check that you have contributor or project manager access.')
      throw new Error('Task could not be created.')
    } finally {
      setBusy(false)
    }
  }

  const changeTaskStatus = async (taskId, status) => {
    setError('')
    setNotice('')
    try {
      await updateDoc(doc(db, 'organisations', selectedOrgId, 'projects', projectId, 'tasks', taskId), {
        status,
        updatedAt: serverTimestamp()
      })
    } catch {
      setError('Task status could not be updated. Check your project permissions.')
    }
  }

  const createMilestone = async values => {
    if (!project || !user?.uid) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await addDoc(collection(db, 'organisations', selectedOrgId, 'projects', projectId, 'milestones'), {
        title: values.title.trim(),
        description: values.description.trim(),
        dueDate: values.dueDate || null,
        status: 'not_started',
        ownerUid: user.uid,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      setNotice('Milestone added to the launch.')
    } catch {
      setError('Milestone could not be created. Only project managers and organisation admins can manage milestones.')
      throw new Error('Milestone could not be created.')
    } finally {
      setBusy(false)
    }
  }

  if (projectsLoading || loading) return <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading launch workspace…</div>
  if (!project) return <div className="v2-empty-state"><h3>Launch not found</h3><p>This launch may have been removed or you may not have access to it.</p><Link className="v2-button v2-button-secondary" to="/app/launches">Back to launches</Link></div>

  return (
    <div className="v2-page">
      <Link className="v2-back-link" to="/app/launches"><Icon name="chevron" size={15}/> Back to launches</Link>
      <div className="v2-launch-title-row">
        <div><span className="v2-eyebrow">LAUNCH WORKSPACE</span><h1>{project.name}</h1><p>{project.description || 'Build the delivery plan for this product launch.'}</p></div>
        <span className={'v2-status-pill status-' + (project.status || 'planning')}>{project.status || 'planning'}</span>
      </div>
      {error && <div className="v2-alert v2-alert-error" role="alert">{error}</div>}
      {notice && <div className="v2-alert v2-alert-success" role="status">{notice}</div>}
      <div className="v2-metrics-grid v2-detail-metrics">
        <div className="v2-metric-card"><div className="v2-metric-icon"><Icon name="check" size={18}/></div><span className="v2-metric-label">Task progress</span><strong className="v2-metric-value">{progress}%</strong><span className="v2-metric-note">{completedCount} of {tasks.length} tasks complete</span></div>
        <div className="v2-metric-card"><div className="v2-metric-icon orange"><Icon name="flag" size={18}/></div><span className="v2-metric-label">Milestones</span><strong className="v2-metric-value">{milestones.length}</strong><span className="v2-metric-note">Delivery checkpoints</span></div>
        <div className="v2-metric-card"><div className="v2-metric-icon purple"><Icon name="clock" size={18}/></div><span className="v2-metric-label">Blocked tasks</span><strong className="v2-metric-value">{blockedCount}</strong><span className="v2-metric-note">Need team attention</span></div>
      </div>

      <div className="v2-launch-tabs" role="tablist" aria-label="Launch sections">
        <button role="tab" aria-selected={activeTab === 'tasks'} className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}><Icon name="list" size={15}/> Tasks <span>{tasks.length}</span></button>
        <button role="tab" aria-selected={activeTab === 'milestones'} className={activeTab === 'milestones' ? 'active' : ''} onClick={() => setActiveTab('milestones')}><Icon name="flag" size={15}/> Milestones <span>{milestones.length}</span></button>
      </div>

      {activeTab === 'tasks' ? (
        <section className="v2-panel v2-delivery-panel">
          <div className="v2-panel-heading"><div><h2>Launch tasks</h2><p>Track the work required to move this launch forward.</p></div></div>
          <TaskForm milestones={milestones} onCreate={createTask} busy={busy}/>
          <div className="v2-task-filter">
            <strong>All tasks <span>{filteredTasks.length}</span></strong>
            <select aria-label="Filter tasks by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          </div>
          {filteredTasks.length ? <div className="v2-task-list">{filteredTasks.map(task => <TaskRow key={task.id} task={task} onStatusChange={changeTaskStatus}/>)}</div> : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="check" size={17}/></span><div><strong>{tasks.length ? 'No tasks match this filter' : 'No tasks added yet'}</strong><p>{tasks.length ? 'Choose another status to see more tasks.' : 'Create the first task for this launch using the form above.'}</p></div></div>}
        </section>
      ) : (
        <section className="v2-panel v2-delivery-panel">
          <div className="v2-panel-heading"><div><h2>Launch milestones</h2><p>Define important delivery checkpoints and see the tasks linked to each one.</p></div></div>
          <MilestoneForm onCreate={createMilestone} busy={busy}/>
          {milestones.length ? <div className="v2-milestone-grid">{milestones.map(item => <MilestoneCard key={item.id} milestone={item} tasks={tasks}/>)}</div> : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="flag" size={17}/></span><div><strong>No milestones defined</strong><p>Add key deliverables such as product approval, QA sign-off and go-to-market readiness.</p></div></div>}
        </section>
      )}
    </div>
  )
}
