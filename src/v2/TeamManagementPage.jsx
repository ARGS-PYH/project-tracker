import React, { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import Icon from './icons.jsx'

export default function TeamManagementPage() {
  const { user } = useAuth()
  const { selectedOrgId, selectedOrganisation } = useWorkspace()
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [memberUids, setMemberUids] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const canManage = ['owner', 'admin'].includes(selectedOrganisation?.role)

  useEffect(() => {
    if (!selectedOrgId) {
      setTeams([])
      setMembers([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    let teamsReady = false
    let membersReady = !canManage
    const complete = () => { if (teamsReady && membersReady) setLoading(false) }
    const unsubscribeTeams = onSnapshot(collection(db, 'organisations', selectedOrgId, 'teams'), snapshot => {
      setTeams(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.name || '').localeCompare(b.name || '')))
      teamsReady = true
      complete()
    }, () => { setError('Teams could not be loaded.'); teamsReady = true; complete() })
    let unsubscribeMembers = () => {}
    if (canManage) {
      unsubscribeMembers = onSnapshot(collection(db, 'organisations', selectedOrgId, 'members'), snapshot => {
        setMembers(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(item => item.status === 'active'))
        membersReady = true
        complete()
      }, () => { setError('Organisation members could not be loaded.'); membersReady = true; complete() })
    }
    return () => { unsubscribeTeams(); unsubscribeMembers() }
  }, [selectedOrgId, canManage])

  const toggleMember = uid => {
    setMemberUids(current => current.includes(uid) ? current.filter(item => item !== uid) : [...current, uid])
  }

  const createTeam = async event => {
    event.preventDefault()
    if (!canManage || !selectedOrgId || !user?.uid) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const teamRef = doc(collection(db, 'organisations', selectedOrgId, 'teams'))
      await setDoc(teamRef, {
        name: name.trim(),
        description: description.trim(),
        memberUids,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      setName('')
      setDescription('')
      setMemberUids([])
      setNotice('Team created.')
    } catch {
      setError('Team could not be created. Only organisation owners and administrators can create teams.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="v2-page">
      <div className="v2-page-header"><div><span className="v2-eyebrow">PEOPLE & COLLABORATION</span><h1>Teams</h1><p>Group people by function so every launch has the right contributors around it.</p></div></div>
      {error && <div className="v2-alert v2-alert-error" role="alert">{error}</div>}
      {notice && <div className="v2-alert v2-alert-success" role="status">{notice}</div>}

      {canManage && (
        <section className="v2-panel">
          <div className="v2-panel-heading"><div><h2>Create a team</h2><p>Set up a department or working group inside this organisation.</p></div><span className="v2-panel-icon"><Icon name="users" size={18}/></span></div>
          <form className="v2-team-form" onSubmit={createTeam}>
            <label className="v2-field"><span>Team name *</span><input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} placeholder="e.g. Product & Design"/></label>
            <label className="v2-field"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={600} placeholder="What does this team own?"/></label>
            <div className="v2-field"><span>Team members</span>{members.length ? <div className="v2-team-member-picker">{members.map(member => <label key={member.id} className="v2-team-member-option"><input type="checkbox" checked={memberUids.includes(member.id)} onChange={() => toggleMember(member.id)}/><span className="v2-avatar">{(member.displayName || member.email || 'U').slice(0,1).toUpperCase()}</span><span><strong>{member.displayName || member.email}</strong><small>{member.email || member.role}</small></span></label>)}</div> : <small className="v2-field-help">Invite organisation members before assigning them to teams.</small>}</div>
            <div className="v2-form-actions"><button className="v2-button v2-button-primary" disabled={busy || name.trim().length < 2}>{busy ? 'Creating team…' : 'Create team'} <Icon name="plus" size={15}/></button></div>
          </form>
        </section>
      )}

      <section className="v2-panel">
        <div className="v2-panel-heading"><div><h2>Organisation teams <span className="v2-count-badge">{teams.length}</span></h2><p>Teams help organise responsibilities across launches.</p></div></div>
        {loading ? <div className="v2-card-loading"><span className="v2-spinner"/>Loading teams…</div> : teams.length ? (
          <div className="v2-team-grid">{teams.map(team => {
            const teamMembers = members.length ? members.filter(member => (team.memberUids || []).includes(member.id)) : []
            return <article className="v2-team-card" key={team.id}><div className="v2-team-card-heading"><span className="v2-team-icon"><Icon name="users" size={18}/></span><span className="v2-count-badge">{(team.memberUids || []).length} members</span></div><h3>{team.name}</h3><p>{team.description || 'No team description yet.'}</p>{teamMembers.length > 0 && <div className="v2-team-avatars">{teamMembers.slice(0,6).map(member => <span title={member.displayName || member.email} key={member.id}>{(member.displayName || member.email || 'U').slice(0,1).toUpperCase()}</span>)}</div>}</article>
          })}</div>
        ) : <div className="v2-list-empty"><span className="v2-list-empty-icon"><Icon name="users" size={17}/></span><div><strong>No teams created yet</strong><p>Create teams such as Product, Engineering, Marketing and Operations.</p></div></div>}
      </section>
    </div>
  )
}
