import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import Icon from './icons.jsx'

const statuses = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' }
]

function PageHeader({ eyebrow = 'WORKSPACE', title, description, action }) {
  return (
    <div className="v2-page-header">
      <div><span className="v2-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action && <div className="v2-page-actions">{action}</div>}
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'No date'
  const date = typeof value === 'string' ? new Date(value + 'T12:00:00') : value?.toDate?.()
  if (!date || Number.isNaN(date.getTime())) return 'No date'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function useProjectData() {
  const { selectedOrgId, projects, projectsLoading } = useWorkspace()
  const { user } = useAuth()
  const projectKey = projects.map(project => project.id).sort().join('|')
  const [tasksByProject, setTasksByProject] = useState({})
  const [milestonesByProject, setMilestonesByProject] = useState({})
  const [rolesByProject, setRolesByProject] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedOrgId || projectsLoading) {
      setLoading(Boolean(projectsLoading))
      return undefined
    }
    if (!projectKey) {
      setTasksByProject({})
      setMilestonesByProject({})
      setRolesByProject({})
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')
    setTasksByProject({})
    setMilestonesByProject({})
    setRolesByProject({})
    const ids = projectKey.split('|')
    const unsubscribers = []

    ids.forEach(projectId => {
      const base = ['organisations', selectedOrgId, 'projects', projectId]
      unsubscribers.push(onSnapshot(collection(db, ...base, 'tasks'), snapshot => {
        if (!active) return
        setTasksByProject(current => ({
          ...current,
          [projectId]: snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
        }))
        setLoading(false)
      }, () => {
        if (!active) return
        setError('Some launch tasks could not be loaded. Check your access and connection.')
        setLoading(false)
      }))

      unsubscribers.push(onSnapshot(collection(db, ...base, 'milestones'), snapshot => {
        if (!active) return
        setMilestonesByProject(current => ({
          ...current,
          [projectId]: snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
        }))
      }, () => {
        if (active) setError('Some milestones could not be loaded.')
      }))

      if (user?.uid) {
        getDoc(doc(db, ...base, 'members', user.uid)).then(snapshot => {
          if (!active) return
          setRolesByProject(current => ({
            ...current,
            [projectId]: snapshot.exists() ? snapshot.data().role : ''
          }))
        }).catch(() => {
          if (active) setRolesByProject(current => ({ ...current, [projectId]: '' }))
        })
      }
    })

    return () => {
      active = false
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [selectedOrgId, projectKey, projectsLoading, user?.uid])

  const tasks = useMemo(() => projects.flatMap(project =>
    (tasksByProject[project.id] || []).map(task => ({
      ...task,
      projectId: project.id,
      projectName: project.name
    }))
  ), [projects, tasksByProject])

  const milestones = useMemo(() => projects.flatMap(project =>
    (milestonesByProject[project.id] || []).map(milestone => ({
      ...milestone,
      projectId: project.id,
      projectName: project.name
    }))
  ), [projects, milestonesByProject])

  return { tasks, milestones, rolesByProject, loading, error }
}

function TaskLine({ task, canEdit, onStatusChange }) {
  return (
    <article className="v2-advanced-row">
      <div className="v2-advanced-row-main">
        <strong>{task.title || 'Untitled task'}</strong>
        <span>{task.projectName} · {task.priority || 'medium'} priority · Due {formatDate(task.dueDate)}</span>
      </div>
      <div className="v2-advanced-row-actions">
        {canEdit ? (
          <select aria-label={'Update status for ' + task.title} value={task.status || 'todo'} onChange={event => onStatusChange(task, event.target.value)}>
            {statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        ) : <span className={'v2-task-status status-' + (task.status || 'todo')}>{(task.status || 'todo').replace('_', ' ')}</span>}
        <Link className="v2-inline-link" to={'/app/launches/' + task.projectId}>Open launch <Icon name="arrow" size={14}/></Link>
      </div>
    </article>
  )
}

export function MyTasksPage() {
  const { user } = useAuth()
  const { selectedOrgId, selectedOrganisation } = useWorkspace()
  const { tasks, loading, error, rolesByProject } = useProjectData()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  const mine = useMemo(() => tasks.filter(task =>
    task.assignedToUid === user?.uid || task.assigneeUids?.includes(user?.uid)
  ), [tasks, user?.uid])

  const filtered = mine.filter(task => {
    const matchesStatus = filter === 'all' || task.status === filter
    const matchesSearch = !search.trim() || (task.title || '').toLowerCase().includes(search.trim().toLowerCase()) || (task.projectName || '').toLowerCase().includes(search.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  const updateStatus = async (task, status) => {
    setActionError('')
    setNotice('')
    if (status === 'done' && task.subtasks?.some(item => !item.complete)) {
      setActionError('Complete all subtasks before marking this task as done.')
      return
    }
    if (status === 'done' && (task.dependsOn || []).some(id => tasks.find(item => item.projectId === task.projectId && item.id === id)?.status !== 'done')) {
      setActionError('Complete the prerequisite tasks before marking this task as done.')
      return
    }
    try {
      await updateDoc(doc(db, 'organisations', selectedOrgId, 'projects', task.projectId, 'tasks', task.id), {
        status,
        updatedAt: serverTimestamp()
      })
      setNotice('Task status updated.')
    } catch {
      setActionError('This task is read-only for your role. Open the launch or ask its project manager for access.')
    }
  }

  return (
    <div className="v2-page">
      <PageHeader title="My tasks" description="Work assigned to you across the launches you can access."/>
      <div className="v2-metrics-grid">
        <div className="v2-metric-card"><span className="v2-metric-label">Assigned to you</span><strong className="v2-metric-value">{mine.length}</strong><span className="v2-metric-note">Across this organisation</span></div>
        <div className="v2-metric-card"><span className="v2-metric-label">In progress</span><strong className="v2-metric-value">{mine.filter(task => task.status === 'in_progress').length}</strong><span className="v2-metric-note">Currently active</span></div>
        <div className="v2-metric-card"><span className="v2-metric-label">Blocked</span><strong className="v2-metric-value">{mine.filter(task => task.status === 'blocked').length}</strong><span className="v2-metric-note">Need attention</span></div>
        <div className="v2-metric-card"><span className="v2-metric-label">Completed</span><strong className="v2-metric-value">{mine.filter(task => task.status === 'done').length}</strong><span className="v2-metric-note">Finished tasks</span></div>
      </div>
      <div className="v2-filter-row">
        <div className="v2-search-box"><Icon name="search" size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tasks or launches" aria-label="Search tasks or launches"/></div>
        <select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter tasks by status"><option value="all">All statuses</option>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
      </div>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {actionError && <div className="v2-alert v2-alert-error">{actionError}</div>}
      {notice && <div className="v2-alert v2-alert-success">{notice}</div>}
      {loading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading your tasks…</div> : filtered.length ? (
        <section className="v2-panel v2-advanced-list">{filtered.map(task => {
          const canEdit = ['owner', 'admin'].includes(selectedOrganisation?.role) || ['project_manager', 'contributor'].includes(rolesByProject[task.projectId])
          return <TaskLine key={task.projectId + ':' + task.id} task={task} canEdit={canEdit} onStatusChange={updateStatus}/>
        })}</section>
      ) : (
        <div className="v2-empty-state v2-empty-state-compact"><span className="v2-empty-icon"><Icon name="check" size={24}/></span><h3>{mine.length ? 'No tasks match this filter' : 'Nothing assigned to you yet'}</h3><p>{mine.length ? 'Try another status or search term.' : 'When a project manager assigns you a task, it will appear here.'}</p></div>
      )}
    </div>
  )
}

export function MilestonesPage() {
  const { milestones, tasks, loading, error } = useProjectData()
  const sorted = [...milestones].sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')))
  return (
    <div className="v2-page">
      <PageHeader title="Milestones" description="Key deliverables and target dates across your organisation's launches."/>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {loading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading milestones…</div> : sorted.length ? (
        <div className="v2-advanced-card-grid">{sorted.map(item => {
          const linked = tasks.filter(task => task.projectId === item.projectId && task.milestoneId === item.id)
          const done = linked.filter(task => task.status === 'done').length
          const percent = linked.length ? Math.round(done / linked.length * 100) : 0
          return <article className="v2-panel v2-advanced-milestone" key={item.projectId + ':' + item.id}>
            <div className="v2-panel-heading"><span className="v2-panel-icon"><Icon name="flag" size={18}/></span><span className="v2-result-count">{formatDate(item.dueDate)}</span></div>
            <h3>{item.title}</h3><p>{item.projectName}</p>{item.description && <p>{item.description}</p>}
            <div className="v2-launch-progress"><div className="v2-launch-progress-label"><span>{done} of {linked.length} linked tasks complete</span><strong>{percent}%</strong></div><div className="v2-progress-track"><span style={{width: percent + '%'}}/></div></div>
            <Link className="v2-inline-link" to={'/app/launches/' + item.projectId}>Open launch <Icon name="arrow" size={14}/></Link>
          </article>
        })}</div>
      ) : <div className="v2-empty-state v2-empty-state-compact"><span className="v2-empty-icon"><Icon name="flag" size={24}/></span><h3>No milestones yet</h3><p>Create milestones inside a launch to build a shared delivery timeline.</p><Link className="v2-button v2-button-primary" to="/app/launches">View launches <Icon name="arrow" size={15}/></Link></div>}
    </div>
  )
}

export function ReportsPage() {
  const { projects, selectedOrganisation } = useWorkspace()
  const { tasks, milestones, loading, error } = useProjectData()
  const completed = tasks.filter(task => task.status === 'done').length
  const blocked = tasks.filter(task => task.status === 'blocked').length
  const overdue = tasks.filter(task => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'done').length
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const launchStates = ['planning', 'in_progress', 'testing', 'ready', 'launched', 'paused']
  return (
    <div className="v2-page">
      <PageHeader title="Reports & insights" description={'A live snapshot of delivery across ' + (selectedOrganisation?.name || 'this organisation') + '.'}/>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      <div className="v2-metrics-grid">
        <div className="v2-metric-card"><span className="v2-metric-label">Launches</span><strong className="v2-metric-value">{projects.length}</strong><span className="v2-metric-note">In this workspace</span></div>
        <div className="v2-metric-card"><span className="v2-metric-label">Task completion</span><strong className="v2-metric-value">{progress}%</strong><span className="v2-metric-note">{completed} of {tasks.length} tasks</span></div>
        <div className="v2-metric-card"><span className="v2-metric-label">Overdue tasks</span><strong className="v2-metric-value">{overdue}</strong><span className="v2-metric-note">Past due and not done</span></div>
        <div className="v2-metric-card"><span className="v2-metric-label">Blocked tasks</span><strong className="v2-metric-value">{blocked}</strong><span className="v2-metric-note">Need attention</span></div>
      </div>
      <div className="v2-insight-grid">
        <section className="v2-panel">
          <div className="v2-panel-heading"><div><h2>Launch portfolio</h2><p>Current lifecycle distribution.</p></div></div>
          {launchStates.map(state => {
            const count = projects.filter(project => project.status === state).length
            return <div className="v2-report-bar-row" key={state}><span>{state.replace('_', ' ')}</span><div className="v2-progress-track"><span style={{width: (projects.length ? count / projects.length * 100 : 0) + '%'}}/></div><strong>{count}</strong></div>
          })}
        </section>
        <section className="v2-panel">
          <div className="v2-panel-heading"><div><h2>Delivery health</h2><p>Task-level indicators across visible launches.</p></div></div>
          <div className="v2-report-stat"><span>Completed tasks</span><strong>{completed}</strong></div>
          <div className="v2-report-stat"><span>Open milestones</span><strong>{milestones.length}</strong></div>
          <div className="v2-report-stat"><span>Blocked tasks</span><strong>{blocked}</strong></div>
          <div className="v2-report-stat"><span>Overdue tasks</span><strong>{overdue}</strong></div>
          <p className="v2-invite-footnote">Figures update from the live Firestore records available to your account.</p>
        </section>
      </div>
      {loading && <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Refreshing report data…</div>}
    </div>
  )
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user?.uid) {
      setItems([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'notifications'), snapshot => {
      setItems(snapshot.docs.map(item => ({id:item.id, ...item.data()})).sort((a,b) => {
        const aDate = a.createdAt?.toMillis?.() || 0
        const bDate = b.createdAt?.toMillis?.() || 0
        return bDate - aDate
      }))
      setLoading(false)
    }, () => {
      setError('Notifications could not be loaded. You can still continue using your workspace.')
      setLoading(false)
    })
    return unsubscribe
  }, [user?.uid])

  const markRead = async item => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', item.id), {read:true, readAt:serverTimestamp()})
    } catch {
      setError('This notification could not be updated.')
    }
  }
  const unread = items.filter(item => !item.read).length
  return (
    <div className="v2-page">
      <PageHeader title="Notifications" description="Updates and reminders sent to your account."/>
      <div className="v2-metrics-grid"><div className="v2-metric-card"><span className="v2-metric-label">Total notifications</span><strong className="v2-metric-value">{items.length}</strong></div><div className="v2-metric-card"><span className="v2-metric-label">Unread</span><strong className="v2-metric-value">{unread}</strong></div></div>
      {error && <div className="v2-alert v2-alert-error">{error}</div>}
      {loading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading notifications…</div> : items.length ? (
        <section className="v2-panel v2-advanced-list">{items.map(item => <article className="v2-advanced-row" key={item.id}><div className="v2-advanced-row-main"><strong>{item.title || item.message || 'Workspace update'}</strong><span>{item.body || item.description || 'You have a new workspace update.'} · {formatDate(item.createdAt)}</span></div><div className="v2-advanced-row-actions">{!item.read && <span className="v2-status-dot"/>}{!item.read && <button className="v2-button v2-button-secondary" onClick={() => markRead(item)}>Mark read</button>}{item.link && <a className="v2-inline-link" href={item.link}>Open <Icon name="arrow" size={14}/></a>}</div></article>)}</section>
      ) : <div className="v2-empty-state v2-empty-state-compact"><span className="v2-empty-icon"><Icon name="bell" size={24}/></span><h3>You're all caught up</h3><p>Notifications sent to your account will appear here.</p></div>}
    </div>
  )
}

export function OrganisationSettingsPage() {
  const { user } = useAuth()
  const { selectedOrgId, selectedOrganisation } = useWorkspace()
  const [name, setName] = useState(selectedOrganisation?.name || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const canManage = ['owner', 'admin'].includes(selectedOrganisation?.role)

  useEffect(() => setName(selectedOrganisation?.name || ''), [selectedOrganisation?.id, selectedOrganisation?.name])

  const save = async event => {
    event.preventDefault()
    if (!canManage) return
    const clean = name.trim()
    if (clean.length < 2 || clean.length > 80) {
      setError('Organisation name must be between 2 and 80 characters.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const organisationBatch = writeBatch(db)
      organisationBatch.update(doc(db, 'organisations', selectedOrgId), {
        name: clean,
        slug: clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48),
        updatedAt: serverTimestamp()
      })
      await organisationBatch.commit()

      const membersSnapshot = await getDocs(collection(db, 'organisations', selectedOrgId, 'members'))
      for (let index = 0; index < membersSnapshot.docs.length; index += 400) {
        const indexBatch = writeBatch(db)
        membersSnapshot.docs.slice(index, index + 400).forEach(member => {
          indexBatch.set(doc(db, 'users', member.id, 'organisations', selectedOrgId), { name: clean }, { merge: true })
        })
        await indexBatch.commit()
      }
      setNotice('Organisation settings saved for all members.')
    } catch {
      setError('Settings could not be saved. Confirm you have administrator access.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="v2-page">
      <PageHeader title="Organisation settings" description="Manage the organisation details shown throughout your PLTK workspace."/>
      <form className="v2-panel v2-launch-form" onSubmit={save}>
        {error && <div className="v2-alert v2-alert-error">{error}</div>}
        {notice && <div className="v2-alert v2-alert-success">{notice}</div>}
        <label className="v2-field"><span>Organisation name</span><input value={name} onChange={event => setName(event.target.value)} maxLength={80} minLength={2} disabled={!canManage}/></label>
        <div className="v2-form-actions"><span className="v2-invite-footnote">{canManage ? 'Changes are visible to your organisation members.' : 'Only an organisation owner or administrator can edit these settings.'}</span>{canManage && <button className="v2-button v2-button-primary" disabled={busy || name.trim().length < 2}>{busy ? 'Saving…' : 'Save changes'} <Icon name="check" size={15}/></button>}</div>
      </form>
    </div>
  )
}
