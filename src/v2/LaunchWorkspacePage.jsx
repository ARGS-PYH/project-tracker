import React, { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import Icon from './icons.jsx'
import { TaskEditor, ReadinessPanel, TaskCommentsPanel, ProjectFilesPanel, ProjectActivityPanel } from './LaunchExtras.jsx'

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

function TaskRow({ task, onStatusChange, onEdit, onOpenComments, readOnly = false }) {
  return (
    <div className="v2-task-row">
      <div className="v2-task-main">
        <span className={'v2-task-check ' + (task.status === 'done' ? 'done' : '')}>{task.status === 'done' && <Icon name="check" size={13}/>}</span>
        <div className="v2-task-copy">
          <strong>{task.title}</strong>
          {task.description && <p>{task.description}</p>}
          <div className="v2-task-meta"><span><Icon name="calendar" size={12}/>{formatDate(task.dueDate)}</span><span className={'v2-priority priority-' + (task.priority || 'medium')}>{task.priority || 'medium'} priority</span>{task.assignedToName && <span><Icon name="user" size={12}/>{task.assignedToName}</span>}</div>
        </div>
      </div>
      <div className="v2-task-controls">
        <StatusPill value={task.status}/>
        <select aria-label={'Update status for ' + task.title} value={task.status || 'todo'} onChange={event => onStatusChange(task.id, event.target.value)} disabled={readOnly}>
          {taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <button type="button" className="v2-text-button" onClick={() => onOpenComments(task)}>Discussion</button>
        {!readOnly && <button type="button" className="v2-text-button" onClick={() => onEdit(task)}>Edit</button>}
      </div>
    </div>
  )
}

function TaskForm({ milestones, members, currentUserId, onCreate, busy }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [milestoneId, setMilestoneId] = useState('')
  const [assigneeUid, setAssigneeUid] = useState(currentUserId || '')

  const submit = async event => {
    event.preventDefault()
    try {
      await onCreate({ title, description, priority, dueDate, milestoneId, assigneeUid })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setMilestoneId('')
      setAssigneeUid(currentUserId || '')
    } catch {
      // The parent displays the actionable Firestore permission or network error.
    }
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
        <label className="v2-field"><span>Assignee</span><select value={assigneeUid} onChange={e => setAssigneeUid(e.target.value)}><option value="">Unassigned</option>{members.map(member => <option key={member.id} value={member.id}>{member.displayName || member.email || member.id}{member.id === currentUserId ? ' (You)' : ''}</option>)}</select></label>
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
    try {
      await onCreate({ title, description, dueDate })
      setTitle('')
      setDescription('')
      setDueDate('')
    } catch {
      // Keep the form values so the user can retry after the parent error is shown.
    }
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
  const { selectedOrgId, selectedOrganisation, projects, projectsLoading } = useWorkspace()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [milestones, setMilestones] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [orgMembers, setOrgMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [teamBusy, setTeamBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')
  const [taskView, setTaskView] = useState('list')
  const [editingTask, setEditingTask] = useState(null)
  const [activeTask, setActiveTask] = useState(null)
  const [files, setFiles] = useState([])
  const [activity, setActivity] = useState([])
  const [readinessBusy, setReadinessBusy] = useState(false)
  const [memberToAdd, setMemberToAdd] = useState('')
  const [roleToAssign, setRoleToAssign] = useState('contributor')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const project = projects.find(item => item.id === projectId)

  useEffect(() => {
    if (!selectedOrgId || !projectId) {
      setLoading(false)
      setTasks([])
      setMilestones([])
      setProjectMembers([])
      setOrgMembers([])
      return undefined
    }
    setLoading(true)
    let tasksReady = false
    let milestonesReady = false
    let projectMembersReady = false
    let orgMembersReady = selectedOrganisation?.role === 'guest'
    const finishIfReady = () => {
      if (tasksReady && milestonesReady && projectMembersReady && orgMembersReady) setLoading(false)
    }
    const base = ['organisations', selectedOrgId, 'projects', projectId]
    const unsubTasks = onSnapshot(collection(db, ...base, 'tasks'), snapshot => {
      setTasks(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')))
      tasksReady = true
      finishIfReady()
    }, () => {
      setError('Tasks could not be loaded. Confirm your project access and try again.')
      tasksReady = true
      finishIfReady()
    })
    const unsubMilestones = onSnapshot(collection(db, ...base, 'milestones'), snapshot => {
      setMilestones(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')))
      milestonesReady = true
      finishIfReady()
    }, () => {
      setError('Milestones could not be loaded. Confirm your project access and try again.')
      milestonesReady = true
      finishIfReady()
    })
    const unsubProjectMembers = onSnapshot(collection(db, ...base, 'members'), snapshot => {
      setProjectMembers(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.role || '').localeCompare(b.role || '')))
      projectMembersReady = true
      finishIfReady()
    }, () => {
      setError('Project access details could not be loaded.')
      projectMembersReady = true
      finishIfReady()
    })
    const unsubFiles = onSnapshot(collection(db, ...base, 'files'), snapshot => {
      setFiles(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
    }, () => {
      setFiles([])
      setError('Launch files could not be loaded. Check your project access.')
    })
    const unsubActivity = onSnapshot(collection(db, ...base, 'activity'), snapshot => {
      setActivity(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
    }, () => {
      setActivity([])
    })
    let unsubOrgMembers = () => {}
    if (selectedOrganisation?.role !== 'guest') {
      unsubOrgMembers = onSnapshot(collection(db, 'organisations', selectedOrgId, 'members'), snapshot => {
        setOrgMembers(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(item => item.status === 'active'))
        orgMembersReady = true
        finishIfReady()
      }, () => {
        setError('Organisation members could not be loaded for project assignment.')
        orgMembersReady = true
        finishIfReady()
      })
    } else {
      setOrgMembers([])
    }
    return () => {
      unsubTasks()
      unsubMilestones()
      unsubProjectMembers()
      unsubOrgMembers()
      unsubFiles()
      unsubActivity()
    }
  }, [selectedOrgId, projectId, selectedOrganisation?.role])

  const filteredTasks = useMemo(() => tasks.filter(task => statusFilter === 'all' || task.status === statusFilter), [tasks, statusFilter])
  const completedCount = tasks.filter(task => task.status === 'done').length
  const blockedCount = tasks.filter(task => task.status === 'blocked').length
  const progress = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0
  const canManageTeam = ['owner', 'admin'].includes(selectedOrganisation?.role)
    || projectMembers.some(member => member.uid === user?.uid && member.role === 'project_manager')
  const canContribute = canManageTeam
    || projectMembers.some(member => member.uid === user?.uid && member.role === 'contributor')
  const unassignedMembers = orgMembers.filter(member =>
    !projectMembers.some(projectMember => projectMember.id === member.id)
  )

  const recordActivity = async (type, message, entityId = '') => {
    if (!user?.uid || !selectedOrgId || !projectId) return
    try {
      await addDoc(collection(db, 'organisations', selectedOrgId, 'projects', projectId, 'activity'), {
        type,
        message,
        entityId,
        actorUid: user.uid,
        actorName: user.displayName || user.email || 'Team member',
        createdAt: serverTimestamp()
      })
    } catch {
      // Activity is supplementary; the primary user action should still succeed.
    }
  }

  const addProjectMember = async () => {
    if (!memberToAdd || !canManageTeam || !project) return
    setTeamBusy(true)
    setError('')
    setNotice('')
    try {
      const batch = writeBatch(db)
      const memberRef = doc(db, 'organisations', selectedOrgId, 'projects', projectId, 'members', memberToAdd)
      const indexRef = doc(db, 'organisations', selectedOrgId, 'members', memberToAdd, 'projects', projectId)
      batch.set(memberRef, {
        uid: memberToAdd,
        role: roleToAssign,
        status: 'active',
        displayName: orgMembers.find(member => member.id === memberToAdd)?.displayName || '',
        email: orgMembers.find(member => member.id === memberToAdd)?.email || '',
        grantedBy: user.uid,
        joinedAt: serverTimestamp()
      })
      batch.set(indexRef, {
        uid: memberToAdd,
        organisationId: selectedOrgId,
        projectId,
        projectName: project.name,
        role: roleToAssign,
        grantedAt: serverTimestamp()
      })
      await batch.commit()
      setMemberToAdd('')
      setRoleToAssign('contributor')
      setNotice('Project access granted.')
    } catch {
      setError('Project access could not be granted. Check that you are a project manager or organisation admin.')
    } finally {
      setTeamBusy(false)
    }
  }

  const removeProjectMember = async member => {
    if (!canManageTeam || member.role === 'project_manager') return
    setTeamBusy(true)
    setError('')
    setNotice('')
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'organisations', selectedOrgId, 'projects', projectId, 'members', member.id))
      batch.delete(doc(db, 'organisations', selectedOrgId, 'members', member.id, 'projects', projectId))
      await batch.commit()
      setNotice('Project access removed.')
    } catch {
      setError('Project access could not be removed. Please try again.')
    } finally {
      setTeamBusy(false)
    }
  }

  const createTask = async values => {
    if (!project || !user?.uid) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const createdTask = await addDoc(collection(db, 'organisations', selectedOrgId, 'projects', projectId, 'tasks'), {
        title: values.title.trim(),
        description: values.description.trim(),
        status: 'todo',
        priority: values.priority,
        dueDate: values.dueDate || null,
        milestoneId: values.milestoneId || null,
        assigneeUids: values.assigneeUid ? [values.assigneeUid] : [],
        assignedToUid: values.assigneeUid || null,
        assignedToName: values.assigneeUid
          ? (projectMembers.find(member => member.id === values.assigneeUid)?.displayName
            || orgMembers.find(member => member.id === values.assigneeUid)?.displayName
            || orgMembers.find(member => member.id === values.assigneeUid)?.email
            || (values.assigneeUid === user.uid ? (user.displayName || user.email) : 'Project member'))
          : null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      await recordActivity('task_created', 'Created task "' + values.title.trim() + '".', createdTask.id)
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
      const changedTask = tasks.find(item => item.id === taskId)
      await recordActivity('task_status_changed', 'Changed "' + (changedTask?.title || 'a task') + '" to ' + status.replace('_', ' ') + '.', taskId)
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
      await recordActivity('milestone_created', 'Created milestone "' + values.title.trim() + '".')
      setNotice('Milestone added to the launch.')
    } catch {
      setError('Milestone could not be created. Only project managers and organisation admins can manage milestones.')
      throw new Error('Milestone could not be created.')
    } finally {
      setBusy(false)
    }
  }

  const updateTask = async values => {
    if (!editingTask || !canContribute) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const member = projectMembers.find(item => item.id === values.assigneeUid) || orgMembers.find(item => item.id === values.assigneeUid)
      await updateDoc(doc(db, 'organisations', selectedOrgId, 'projects', projectId, 'tasks', editingTask.id), {
        title: values.title.trim(),
        description: (values.description || '').trim(),
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
        milestoneId: values.milestoneId || null,
        assigneeUids: values.assigneeUid ? [values.assigneeUid] : [],
        assignedToUid: values.assigneeUid || null,
        assignedToName: values.assigneeUid ? (member?.displayName || member?.email || (values.assigneeUid === user.uid ? user.email : 'Project member')) : null,
        updatedAt: serverTimestamp()
      })
      await recordActivity('task_updated', 'Updated task "' + values.title.trim() + '".', editingTask.id)
      setEditingTask(null)
      setNotice('Task updated.')
    } catch {
      setError('Task could not be updated. Check your project permissions and try again.')
    } finally {
      setBusy(false)
    }
  }

  const saveReadiness = async checks => {
    if (!canManageTeam || !project) return
    setReadinessBusy(true)
    setError('')
    setNotice('')
    const completed = checks.filter(item => item.complete).length
    const readinessStatus = completed === checks.length ? 'ready' : completed > 0 ? 'in_progress' : 'not_started'
    try {
      await updateDoc(doc(db, 'organisations', selectedOrgId, 'projects', projectId), {
        readinessChecks: checks,
        readinessStatus,
        updatedAt: serverTimestamp()
      })
      await recordActivity('readiness_updated', 'Updated launch readiness to ' + readinessStatus.replace('_', ' ') + '.')
      setNotice('Launch readiness saved.')
    } catch {
      setError('Readiness could not be saved. Only a project manager or organisation administrator can update it.')
    } finally {
      setReadinessBusy(false)
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
        <button role="tab" aria-selected={activeTab === 'readiness'} className={activeTab === 'readiness' ? 'active' : ''} onClick={() => setActiveTab('readiness')}><Icon name="shield" size={15}/> Readiness</button>
        <button role="tab" aria-selected={activeTab === 'files'} className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}><Icon name="folder" size={15}/> Files <span>{files.length}</span></button>
        <button role="tab" aria-selected={activeTab === 'activity'} className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}><Icon name="clock" size={15}/> Activity <span>{activity.length}</span></button>
        <button role="tab" aria-selected={activeTab === 'team'} className={activeTab === 'team' ? 'active' : ''} onClick={() => setActiveTab('team')}><Icon name="users" size={15}/> Team <span>{projectMembers.length}</span></button>
      </div>

      {activeTab === 'tasks' ? (
        <section className="v2-panel v2-delivery-panel">
          <div className="v2-panel-heading"><div><h2>Launch tasks</h2><p>Track the work required to move this launch forward.</p></div></div>
          {canContribute && <TaskForm milestones={milestones} members={projectMembers.filter(member => ['project_manager', 'contributor'].includes(member.role))} currentUserId={user?.uid} onCreate={createTask} busy={busy}/>}
          <div className="v2-task-filter">
            <strong>All tasks <span>{filteredTasks.length}</span></strong>
            <div className="v2-task-view-switcher" role="group" aria-label="Task layout">
              <button className={taskView === 'list' ? 'active' : ''} onClick={() => setTaskView('list')}>List</button>
              <button className={taskView === 'board' ? 'active' : ''} onClick={() => setTaskView('board')}>Board</button>
              <button className={taskView === 'timeline' ? 'active' : ''} onClick={() => setTaskView('timeline')}>Timeline</button>
            </div>
            <select aria-label="Filter tasks by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          </div>
          {filteredTasks.length ? taskView === 'board' ? (
            <div className="v2-kanban-board">
              {taskStatuses.map(status => {
                const columnTasks = filteredTasks.filter(task => task.status === status.value)
                return <section className="v2-kanban-column" key={status.value}>
                  <div className="v2-kanban-column-heading"><strong>{status.label}</strong><span>{columnTasks.length}</span></div>
                  {columnTasks.map(task => <article className="v2-kanban-card" key={task.id}>
                    <strong>{task.title}</strong>
                    <small>{task.priority || 'medium'} priority · {formatDate(task.dueDate)}</small>
                    {task.assignedToName && <small>Assigned to {task.assignedToName}</small>}
                    <div className="v2-kanban-actions">
                      <select aria-label={'Change status for ' + task.title} value={task.status || 'todo'} disabled={!canContribute} onChange={event => changeTaskStatus(task.id, event.target.value)}>{taskStatuses.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
                      <button className="v2-text-button" onClick={() => setActiveTask(task)}>Discussion</button>
                      {canContribute && <button className="v2-text-button" onClick={() => setEditingTask(task)}>Edit</button>}
                    </div>
                  </article>)}
                  {!columnTasks.length && <div className="v2-kanban-empty">No tasks</div>}
                </section>
              })}
            </div>
          ) : (
            <div className="v2-task-list">{filteredTasks.map(task => <TaskRow key={task.id} task={task} onStatusChange={changeTaskStatus} onEdit={setEditingTask} onOpenComments={setActiveTask} readOnly={!canContribute}/>)}</div>
          ) : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="check" size={17}/></span><div><strong>{tasks.length ? 'No tasks match this filter' : 'No tasks added yet'}</strong><p>{tasks.length ? 'Choose another status to see more tasks.' : canContribute ? 'Create the first task for this launch using the form above.' : 'A project contributor can add the first task.'}</p></div></div>}
          {editingTask && canContribute && <TaskEditor task={editingTask} milestones={milestones} members={projectMembers.filter(member => ['project_manager','contributor'].includes(member.role))} onSave={updateTask} onCancel={() => setEditingTask(null)} busy={busy}/>}
          {activeTask && <TaskCommentsPanel orgId={selectedOrgId} projectId={projectId} task={activeTask} user={user} canComment={canContribute} canManage={canManageTeam} onActivity={recordActivity}/>}
          {!canContribute && <p className="v2-invite-footnote">You have read-only access to this launch.</p>}
        </section>
      ) : activeTab === 'milestones' ? (
        <section className="v2-panel v2-delivery-panel">
          <div className="v2-panel-heading"><div><h2>Launch milestones</h2><p>Define important delivery checkpoints and see the tasks linked to each one.</p></div></div>
          {canManageTeam && <MilestoneForm onCreate={createMilestone} busy={busy}/>}
          {milestones.length ? <div className="v2-milestone-grid">{milestones.map(item => <MilestoneCard key={item.id} milestone={item} tasks={tasks}/>)}</div> : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="flag" size={17}/></span><div><strong>No milestones defined</strong><p>Add key deliverables such as product approval, QA sign-off and go-to-market readiness.</p></div></div>}
        </section>
      ) : activeTab === 'readiness' ? (
        <ReadinessPanel project={project} canManage={canManageTeam} onSave={saveReadiness} busy={readinessBusy}/>
      ) : activeTab === 'files' ? (
        <ProjectFilesPanel orgId={selectedOrgId} projectId={projectId} user={user} canUpload={canContribute} canDelete={canManageTeam} onActivity={recordActivity}/>
      ) : activeTab === 'activity' ? (
        <ProjectActivityPanel items={activity}/>
      ) : (
        <section className="v2-panel v2-delivery-panel">
          <div className="v2-panel-heading"><div><h2>Launch team</h2><p>Control which organisation members can view or contribute to this launch.</p></div></div>
          {canManageTeam && (
            <div className="v2-project-member-form">
              <label className="v2-field"><span>Organisation member</span><select value={memberToAdd} onChange={event => setMemberToAdd(event.target.value)}><option value="">Choose a member</option>{unassignedMembers.map(member => <option key={member.id} value={member.id}>{member.displayName || member.email || member.id} · {member.role}</option>)}</select></label>
              <label className="v2-field"><span>Project access</span><select value={roleToAssign} onChange={event => setRoleToAssign(event.target.value)}><option value="contributor">Contributor — can update tasks</option><option value="viewer">Viewer — read-only access</option></select></label>
              <button className="v2-button v2-button-primary" onClick={addProjectMember} disabled={teamBusy || !memberToAdd}>{teamBusy ? 'Saving…' : 'Grant access'} <Icon name="plus" size={15}/></button>
            </div>
          )}
          {projectMembers.length ? (
            <div className="v2-project-member-list">
              {projectMembers.map(member => {
                const profile = orgMembers.find(item => item.id === member.id)
                return <div className="v2-project-member-row" key={member.id}><span className="v2-avatar">{(profile?.displayName || profile?.email || member.uid || 'U').slice(0,1).toUpperCase()}</span><div className="v2-member-info"><strong>{profile?.displayName || profile?.email || 'Project member'}</strong><small>{profile?.email || member.uid}</small></div><span className={'v2-role-pill role-' + member.role}>{member.role.replace('_',' ')}</span>{canManageTeam && member.role !== 'project_manager' && <button className="v2-text-button v2-remove-access" onClick={() => removeProjectMember(member)} disabled={teamBusy}>Remove</button>}</div>
              })}
            </div>
          ) : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="users" size={17}/></span><div><strong>No project members yet</strong><p>Invite organisation colleagues into this launch to share tasks and milestones.</p></div></div>}
          {!canManageTeam && <p className="v2-invite-footnote">Only project managers and organisation administrators can change launch access.</p>}
        </section>
      )}
    </div>
  )
}
