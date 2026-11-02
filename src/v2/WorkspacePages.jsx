import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useWorkspace } from './WorkspaceContext.jsx'
import Icon from './icons.jsx'

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="v2-page-header">
      <div>
        {eyebrow && <span className="v2-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="v2-page-actions">{action}</div>}
    </div>
  )
}

function MetricCard({ label, value, note, icon, tone = 'green' }) {
  return (
    <div className="v2-metric-card">
      <div className={'v2-metric-icon ' + tone}><Icon name={icon} size={18}/></div>
      <span className="v2-metric-label">{label}</span>
      <strong className="v2-metric-value">{value}</strong>
      <span className="v2-metric-note">{note}</span>
    </div>
  )
}

function dateLabel(value) {
  if (!value) return 'No target date'
  const date = typeof value === 'string' ? new Date(value + 'T12:00:00') : value?.toDate?.()
  if (!date || Number.isNaN(date.getTime())) return 'No target date'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function LaunchStatus({ status }) {
  const label = {
    planning: 'Planning',
    in_progress: 'In progress',
    testing: 'Testing',
    ready: 'Ready to launch',
    launched: 'Launched',
    paused: 'Paused'
  }[status] || 'Planning'
  return <span className={'v2-status-pill status-' + (status || 'planning')}>{label}</span>
}

function LaunchCard({ project }) {
  return (
    <Link to={'/app/launches/' + project.id} className="v2-launch-card">
      <div className="v2-launch-card-top">
        <span className="v2-launch-mark"><Icon name="rocket" size={18}/></span>
        <LaunchStatus status={project.status}/>
      </div>
      <h3>{project.name}</h3>
      <p>{project.description || 'No project description has been added yet.'}</p>
      <div className="v2-launch-progress">
        <div className="v2-launch-progress-label"><span>Task progress</span><strong>{Number(project.progress || 0)}%</strong></div>
        <div className="v2-progress-track"><span style={{ width: Math.max(0, Math.min(100, Number(project.progress || 0))) + '%' }}/></div>
      </div>
      <div className="v2-launch-card-foot">
        <span><Icon name="calendar" size={14}/>{dateLabel(project.targetLaunchDate)}</span>
        <span><Icon name="user" size={14}/>{project.ownerName || 'Project owner'}</span>
      </div>
    </Link>
  )
}

function EmptyLaunches({ onCreate }) {
  return (
    <div className="v2-empty-state">
      <span className="v2-empty-icon"><Icon name="rocket" size={25}/></span>
      <h3>Your first launch starts here</h3>
      <p>Create a launch workspace to organise deliverables, bring teams together and track readiness from planning through release.</p>
      <button className="v2-button v2-button-primary" onClick={onCreate}><Icon name="plus" size={17}/> Create launch</button>
    </div>
  )
}

export function OverviewPage() {
  const { projects, projectsLoading } = useOutletContext()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const stats = useMemo(() => {
    const active = projects.filter(project => !['launched', 'paused'].includes(project.status))
    const launched = projects.filter(project => project.status === 'launched')
    const overdue = active.filter(project => project.targetLaunchDate && project.targetLaunchDate < today)
    const average = projects.length ? Math.round(projects.reduce((sum, item) => sum + Number(item.progress || 0), 0) / projects.length) : 0
    return { active: active.length, launched: launched.length, overdue: overdue.length, average }
  }, [projects, today])

  return (
    <div className="v2-page">
      <PageHeader
        eyebrow="ORGANISATION OVERVIEW"
        title="Good to see you."
        description="Here's what is happening across your product launches."
        action={<button className="v2-button v2-button-primary" onClick={() => navigate('/app/launches/new')}><Icon name="plus" size={17}/> New launch</button>}
      />
      <div className="v2-metrics-grid">
        <MetricCard label="Active launches" value={stats.active} note="Currently in progress" icon="rocket"/>
        <MetricCard label="Launched" value={stats.launched} note="Successfully released" icon="check" tone="blue"/>
        <MetricCard label="Overdue launches" value={stats.overdue} note="Past target launch date" icon="clock" tone="orange"/>
        <MetricCard label="Average progress" value={stats.average + '%'} note="Across all launches" icon="chart" tone="purple"/>
      </div>

      <div className="v2-section-heading">
        <div><h2>Active launches</h2><p>Keep an eye on the work moving towards launch.</p></div>
        <Link to="/app/launches" className="v2-inline-link">View all <Icon name="arrow" size={15}/></Link>
      </div>

      {projectsLoading ? (
        <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading launches…</div>
      ) : projects.length ? (
        <div className="v2-launch-grid">
          {projects.filter(project => project.status !== 'launched').slice(0, 3).map(project => <LaunchCard key={project.id} project={project}/>)}
        </div>
      ) : (
        <EmptyLaunches onCreate={() => navigate('/app/launches/new')}/>
      )}

      <div className="v2-insight-grid">
        <section className="v2-panel">
          <div className="v2-panel-heading"><div><h2>Launch readiness</h2><p>Know what is holding your launch back.</p></div><span className="v2-panel-icon"><Icon name="shield" size={18}/></span></div>
          <div className="v2-readiness-empty">
            <div className="v2-readiness-ring"><span>—</span></div>
            <div><strong>Readiness checks are next</strong><p>Readiness will be calculated from evidence-backed checks across product, engineering, quality, marketing and operations.</p></div>
          </div>
        </section>
        <section className="v2-panel">
          <div className="v2-panel-heading"><div><h2>Upcoming milestones</h2><p>Important launch dates across your workspace.</p></div><span className="v2-panel-icon"><Icon name="flag" size={18}/></span></div>
          <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="calendar" size={18}/></span><div><strong>Milestones will appear here</strong><p>Create milestones within a launch to build your delivery timeline.</p></div></div>
        </section>
      </div>
    </div>
  )
}

export function LaunchesPage() {
  const { projects, projectsLoading } = useOutletContext()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const filteredProjects = projects.filter(project => {
    const term = search.trim().toLowerCase()
    return !term || project.name?.toLowerCase().includes(term) || project.description?.toLowerCase().includes(term)
  })
  return (
    <div className="v2-page">
      <PageHeader eyebrow="PROJECT PORTFOLIO" title="Launches" description="Plan, coordinate and track every product launch in this organisation."
        action={<button className="v2-button v2-button-primary" onClick={() => navigate('/app/launches/new')}><Icon name="plus" size={17}/> New launch</button>}/>
      <div className="v2-filter-row">
        <div className="v2-search-box"><Icon name="search" size={17}/><input placeholder="Search launches" aria-label="Search launches" value={search} onChange={event => setSearch(event.target.value)}/></div>
        <span className="v2-result-count">{filteredProjects.length} {filteredProjects.length === 1 ? 'launch' : 'launches'}</span>
      </div>
      {projectsLoading ? <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading launches…</div> : projects.length ? (
        <div className="v2-launch-grid">{projects.map(project => <LaunchCard key={project.id} project={project}/>)}</div>
      ) : <EmptyLaunches onCreate={() => navigate('/app/launches/new')}/>}
    </div>
  )
}

export function NewLaunchPage() {
  const { createLaunch } = useWorkspace()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetLaunchDate, setTargetLaunchDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const id = await createLaunch({ name, description, targetLaunchDate })
      navigate('/app/launches/' + id)
    } catch (err) {
      setError(err.message || 'Launch could not be created. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="v2-page v2-form-page">
      <button className="v2-back-link" onClick={() => navigate('/app/launches')}><Icon name="chevron" size={15}/> Back to launches</button>
      <PageHeader eyebrow="NEW PRODUCT LAUNCH" title="Create a launch" description="Start with the basics. You can add teams, milestones and tasks next."/>
      <form className="v2-panel v2-launch-form" onSubmit={submit}>
        {error && <div className="v2-alert v2-alert-error">{error}</div>}
        <label className="v2-field"><span>Launch name <b>*</b></span><input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="e.g. BetaOuse public launch" required minLength={3}/></label>
        <label className="v2-field"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder="What are you launching, and what does success look like?"/></label>
        <label className="v2-field"><span>Target launch date</span><input type="date" value={targetLaunchDate} onChange={e => setTargetLaunchDate(e.target.value)}/><small>Set a date now or add one later.</small></label>
        <div className="v2-form-actions"><button type="button" className="v2-button v2-button-secondary" onClick={() => navigate('/app/launches')}>Cancel</button><button className="v2-button v2-button-primary" disabled={busy || name.trim().length < 3}>{busy ? 'Creating launch…' : 'Create launch'} <Icon name="arrow" size={17}/></button></div>
      </form>
    </div>
  )
}

export function LaunchDetailPage() {
  const { projectId } = useParams()
  const { projects, projectsLoading } = useWorkspace()
  const project = projects.find(item => item.id === projectId)
  if (projectsLoading) return <div className="v2-card v2-card-loading"><span className="v2-spinner"/>Loading launch…</div>
  if (!project) return <div className="v2-empty-state"><h3>Launch not found</h3><p>This launch may have been removed or you may not have access to it.</p><Link className="v2-button v2-button-secondary" to="/app/launches">Back to launches</Link></div>
  return (
    <div className="v2-page">
      <Link className="v2-back-link" to="/app/launches"><Icon name="chevron" size={15}/> Back to launches</Link>
      <PageHeader eyebrow="LAUNCH WORKSPACE" title={project.name} description={project.description || 'Add a description to explain the goal of this launch.'} action={<LaunchStatus status={project.status}/>}/>
      <div className="v2-metrics-grid v2-detail-metrics">
        <MetricCard label="Task progress" value={Number(project.progress || 0) + '%'} note="Completed project work" icon="chart"/>
        <MetricCard label="Launch status" value={project.status === 'launched' ? 'Launched' : 'In planning'} note="Current lifecycle status" icon="rocket" tone="blue"/>
        <MetricCard label="Target date" value={dateLabel(project.targetLaunchDate)} note="Planned launch date" icon="calendar" tone="orange"/>
      </div>
      <section className="v2-panel">
        <div className="v2-panel-heading"><div><h2>Next: build your launch plan</h2><p>Milestones and tasks will turn this launch into an actionable delivery plan.</p></div></div>
        <div className="v2-next-steps">
          <div><span>01</span><div><strong>Set launch milestones</strong><p>Define the major deliverables from planning through post-launch.</p></div></div>
          <div><span>02</span><div><strong>Bring in the right teams</strong><p>Assign owners and contributors for each workstream.</p></div></div>
          <div><span>03</span><div><strong>Track tasks and readiness</strong><p>Make progress, approvals and blockers visible to everyone.</p></div></div>
        </div>
      </section>
    </div>
  )
}

export function PlaceholderPage({ title, description }) {
  return (
    <div className="v2-page">
      <PageHeader eyebrow="WORKSPACE" title={title} description={description}/>
      <div className="v2-empty-state v2-empty-state-compact">
        <span className="v2-empty-icon"><Icon name="grid" size={24}/></span>
        <h3>This workspace is being prepared</h3>
        <p>The information architecture is in place. This section will be implemented as part of the next product releases.</p>
      </div>
    </div>
  )
}
