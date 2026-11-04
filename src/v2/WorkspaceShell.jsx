import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import Icon from './icons.jsx'
import Brand from './Brand.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const primaryNav = [
  { to: '/app/overview', label: 'Overview', icon: 'grid' },
  { to: '/app/launches', label: 'Launches', icon: 'rocket' },
  { to: '/app/tasks', label: 'My tasks', icon: 'check' },
  { to: '/app/milestones', label: 'Milestones', icon: 'flag' },
  { to: '/app/teams', label: 'Teams', icon: 'users' },
  { to: '/app/reports', label: 'Reports', icon: 'chart' },
  { to: '/app/notifications', label: 'Notifications', icon: 'bell' }
]

function LoadingScreen() {
  return <div className="v2-loading"><span className="v2-spinner"/><span>Preparing your workspace…</span></div>
}

function VerifyEmailScreen() {
  const { user, sendVerification, refreshUser, signOut } = useAuth()
  const location = useLocation()
  const verificationWasSent = location.state?.signupVerificationSent
  const verificationErrorCode = location.state?.signupVerificationErrorCode
  const profileWasUpdated = location.state?.signupProfileUpdated
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(() => {
    if (verificationWasSent === false) {
      return 'Your account was created, but the verification email could not be sent. Use the resend button below.'
    }
    if (profileWasUpdated === false) {
      return 'Your account was created. We could not save your display name, but you can continue verifying your email.'
    }
    return ''
  })
  const [error, setError] = useState('')

  const resend = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await sendVerification()
      setMessage('A new verification email has been sent.')
    } catch (sendError) {
      const messages = {
        'auth/too-many-requests': 'Firebase has temporarily limited verification emails. Try again later.',
        'auth/unauthorized-domain': 'This website is not authorised in Firebase. Add projectluncher.web.app to Authentication → Settings → Authorized domains.',
        'auth/network-request-failed': 'Could not reach Firebase. Check your connection and retry.'
      }
      const code = sendError?.code || 'unknown'
      setError(messages[code] || `We could not send the email. Firebase reference: ${code}.`)
    } finally {
      setBusy(false)
    }
  }

  const check = async () => {
    setBusy(true)
    setError('')
    try {
      await refreshUser()
    } catch {
      setError('We could not refresh your account status. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="v2-auth-page">
      <section className="v2-auth-card v2-verify-card">
        <div className="v2-onboarding-head"><Brand to="/" /><ThemeToggle /></div>
        <span className="v2-verify-icon"><Icon name="shield" size={24}/></span>
        <span className="v2-eyebrow">ONE MORE STEP</span>
        <h1>Verify your email</h1>
        <p>{verificationWasSent === false
          ? <>Your account is ready, but we could not send the verification email to <strong>{user?.email}</strong>. You can request another one below.</>
          : <>We sent a verification link to <strong>{user?.email}</strong>. Verify your address, then return here to continue.</>}</p>
        {verificationErrorCode && <p className="v2-auth-help">Firebase reference: {verificationErrorCode}</p>}
        {message && <div className="v2-alert v2-alert-success">{message}</div>}
        {error && <div className="v2-alert v2-alert-error">{error}</div>}
        <button className="v2-button v2-button-primary v2-button-full" onClick={check} disabled={busy}>I've verified my email</button>
        <button className="v2-button v2-button-secondary v2-button-full" onClick={resend} disabled={busy}>Resend verification email</button>
        <button className="v2-text-button" onClick={signOut}>Sign out</button>
      </section>
    </div>
  )
}

function CreateOrganisationScreen() {
  const { user } = useAuth()
  const { createOrganisation } = useWorkspace()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await createOrganisation(name)
    } catch (err) {
      setError(err.message || 'We could not create your organisation. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="v2-onboarding">
      <div className="v2-onboarding-card">
        <div className="v2-onboarding-head"><Brand to="/" /><ThemeToggle /></div>
        <span className="v2-eyebrow">YOUR WORKSPACE STARTS HERE</span>
        <h1>Create your organisation</h1>
        <p>Set up an organisation to bring projects, teams and launch activity together. You can invite colleagues after setup.</p>
        {error && <div className="v2-alert v2-alert-error">{error}</div>}
        <form className="v2-form" onSubmit={submit}>
          <label className="v2-field">
            <span>Organisation name</span>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="e.g. Peregrine Solution" required />
          </label>
          <button className="v2-button v2-button-primary v2-button-full" type="submit" disabled={busy || name.trim().length < 2}>
            {busy ? 'Creating workspace…' : 'Create organisation'} <Icon name="arrow" size={17}/>
          </button>
        </form>
        <div className="v2-user-note"><span className="v2-avatar">{(user?.displayName || user?.email || 'U').slice(0, 1).toUpperCase()}</span><span>Signed in as <strong>{user?.email}</strong></span></div>
      </div>
    </div>
  )
}

function Sidebar({ onClose }) {
  const { organisations, selectedOrgId, selectedOrganisation, setSelectedOrgId } = useWorkspace()
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <aside className="v2-sidebar">
      <div className="v2-sidebar-head">
        <Brand to="/app/overview" onClick={onClose} />
        <button className="v2-icon-button v2-mobile-close" onClick={onClose} aria-label="Close menu"><Icon name="x"/></button>
      </div>

      <div className="v2-org-picker">
        <span className="v2-org-avatar"><Icon name="building" size={17}/></span>
        <span className="v2-org-select-wrap">
          <span className="v2-org-label">WORKSPACE</span>
          <select aria-label="Select organisation" value={selectedOrgId} onChange={e => { setSelectedOrgId(e.target.value); onClose?.() }}>
            {organisations.map(org => <option value={org.id} key={org.id}>{org.name}</option>)}
          </select>
        </span>
        <Icon name="chevronDown" size={15} className="v2-muted-icon"/>
      </div>

      <div className="v2-nav-label">WORKSPACE</div>
      <nav className="v2-nav">
        {primaryNav.filter(item => selectedOrganisation?.role !== 'guest' || ['Overview', 'Launches', 'My tasks'].includes(item.label)).map(item => (
          <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => 'v2-nav-link' + (isActive ? ' active' : '')}>
            <Icon name={item.icon}/><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="v2-sidebar-spacer"/>
      {['owner', 'admin'].includes(selectedOrganisation?.role) && (
        <>
          <div className="v2-nav-label">ADMINISTRATION</div>
          <nav className="v2-nav">
            <NavLink to="/app/settings" onClick={onClose} className={({ isActive }) => 'v2-nav-link' + (isActive ? ' active' : '')}><Icon name="settings"/><span>Settings</span></NavLink>
            <NavLink to="/app/members" onClick={onClose} className={({ isActive }) => 'v2-nav-link' + (isActive ? ' active' : '')}><Icon name="shield"/><span>Members & access</span></NavLink>
            <NavLink to="/app/launches/deleted" onClick={onClose} className={({ isActive }) => 'v2-nav-link' + (isActive ? ' active' : '')}><Icon name="trash"/><span>Deleted launches</span></NavLink>
          </nav>
        </>
      )}

      <div className="v2-sidebar-bottom">
        <button className="v2-nav-link v2-plain-nav" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/><span>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</span></button>
        <div className="v2-profile-row">
          <span className="v2-avatar">{(user?.displayName || user?.email || 'U').slice(0, 1).toUpperCase()}</span>
          <span className="v2-profile-copy"><strong>{user?.displayName || 'Your account'}</strong><small>{user?.email}</small></span>
          <button className="v2-icon-button" title="Sign out" aria-label="Sign out" onClick={async () => { await signOut(); navigate('/app/login', { replace: true }) }}><Icon name="logout" size={17}/></button>
        </div>
      </div>
    </aside>
  )
}

export default function WorkspaceShell() {
  const { user } = useAuth()
  const { organisations, organisationLoading, projects, projectsLoading, selectedOrganisation, error, clearError } = useWorkspace()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user?.emailVerified) return <VerifyEmailScreen/>
  if (organisationLoading) return <LoadingScreen/>
  if (!organisations.length) return <CreateOrganisationScreen/>

  return (
    <div className="v2-app">
      {mobileOpen && <button className="v2-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)}/>}
      <div className={mobileOpen ? 'v2-sidebar-wrap open' : 'v2-sidebar-wrap'}><Sidebar onClose={() => setMobileOpen(false)}/></div>
      <div className="v2-main">
        <header className="v2-topbar">
          <button className="v2-icon-button v2-mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Icon name="menu"/></button>
          <div className="v2-breadcrumb"><span>{selectedOrganisation?.name || 'Organisation workspace'}</span><Icon name="chevron" size={14}/><strong>Product launch tracker</strong></div>
          <div className="v2-topbar-actions"><span className="v2-status-dot"/> <span className="v2-connection-label">Connected</span></div>
        </header>
        {error && <div className="v2-global-alert"><span>{error}</span><button onClick={clearError} aria-label="Dismiss message"><Icon name="x" size={16}/></button></div>}
        <main className="v2-content"><Outlet context={{ projects, projectsLoading, selectedOrganisation }}/></main>
        <footer className="v2-footer"><span>PLTK · Product Launch Tracker</span><span><Link to="/privacy">Privacy policy</Link> · © 2026 Peregrine Solution. All rights reserved.</span></footer>
      </div>
    </div>
  )
}
