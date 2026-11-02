import React, { useEffect, useState } from 'react'
import { collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from './auth/AuthProvider.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import Icon from './icons.jsx'

function RolePill({ role }) {
  return <span className={'v2-role-pill role-' + role}>{role}</span>
}

export default function MemberManagementPage() {
  const { user } = useAuth()
  const { selectedOrgId, selectedOrganisation } = useWorkspace()
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const canInvite = ['owner', 'admin'].includes(selectedOrganisation?.role)

  useEffect(() => {
    if (!selectedOrgId || !canInvite) {
      setMembers([])
      setInvitations([])
      setLoading(false)
      return undefined
    }
    setLoading(true)
    let membersReady = false
    let invitesReady = false
    const maybeDone = () => { if (membersReady && invitesReady) setLoading(false) }
    const unsubMembers = onSnapshot(collection(db, 'organisations', selectedOrgId, 'members'), snapshot => {
      setMembers(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')))
      membersReady = true
      maybeDone()
    }, () => { setError('Organisation members could not be loaded.'); membersReady = true; maybeDone() })
    const unsubInvites = onSnapshot(collection(db, 'organisations', selectedOrgId, 'invitations'), snapshot => {
      setInvitations(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
      invitesReady = true
      maybeDone()
    }, () => { setError('Invitations could not be loaded.'); invitesReady = true; maybeDone() })
    return () => { unsubMembers(); unsubInvites() }
  }, [selectedOrgId, canInvite])

  const createInvitation = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    setInviteLink('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.')
      setBusy(false)
      return
    }
    if (members.some(member => member.email?.toLowerCase() === cleanEmail && member.status === 'active')) {
      setError('This person is already a member of the organisation.')
      setBusy(false)
      return
    }
    if (invitations.some(invitation => invitation.email?.toLowerCase() === cleanEmail && invitation.status === 'pending' && (!invitation.expiresAt?.toDate || invitation.expiresAt.toDate() > new Date()))) {
      setError('There is already a pending invitation for this email address.')
      setBusy(false)
      return
    }
    try {
      const invitationRef = doc(collection(db, 'organisations', selectedOrgId, 'invitations'))
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      await setDoc(invitationRef, {
        organisationId: selectedOrgId,
        orgName: selectedOrganisation?.name || '',
        email: cleanEmail,
        role: 'member',
        status: 'pending',
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Workspace admin',
        createdAt: serverTimestamp(),
        expiresAt
      })
      setInviteLink(window.location.origin + '/invite/' + selectedOrgId + '/' + invitationRef.id)
      setNotice('Invitation created. Copy the link and share it with ' + cleanEmail + '.')
      setEmail('')
    } catch {
      setError('Invitation could not be created. Only organisation owners and admins can invite members.')
    } finally {
      setBusy(false)
    }
  }

  const changeMemberRole = async (member, role) => {
    if (!canInvite || !member || member.role === 'owner' || member.id === user?.uid) return
    const allowed = selectedOrganisation?.role === 'owner'
      ? ['admin', 'member', 'guest']
      : ['member', 'guest']
    if (!allowed.includes(role) || role === member.role) return
    setError('')
    setNotice('')
    try {
      await updateDoc(doc(db, 'organisations', selectedOrgId, 'members', member.id), {
        role,
        roleUpdatedAt: serverTimestamp(),
        roleUpdatedBy: user.uid
      })
      setNotice((member.displayName || member.email || 'Member') + ' is now a ' + role + '.')
    } catch {
      setError('Member role could not be changed. Only organisation owners and administrators can manage roles.')
    }
  }

  const removeMember = async member => {
    if (!canInvite || !member || member.role === 'owner' || member.id === user?.uid) return
    const label = member.displayName || member.email || 'this member'
    if (!window.confirm('Remove ' + label + ' from this organisation and revoke all launch access?')) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const projectsSnapshot = await getDocs(collection(db, 'organisations', selectedOrgId, 'projects'))
      const projectDocs = projectsSnapshot.docs
      for (let index = 0; index < projectDocs.length; index += 200) {
        const batch = writeBatch(db)
        projectDocs.slice(index, index + 200).forEach(project => {
          batch.delete(doc(db, 'organisations', selectedOrgId, 'projects', project.id, 'members', member.id))
          batch.delete(doc(db, 'organisations', selectedOrgId, 'members', member.id, 'projects', project.id))
        })
        await batch.commit()
      }

      const teamsSnapshot = await getDocs(collection(db, 'organisations', selectedOrgId, 'teams'))
      for (let index = 0; index < teamsSnapshot.docs.length; index += 200) {
        const batch = writeBatch(db)
        teamsSnapshot.docs.slice(index, index + 200).forEach(team => {
          const memberUids = (team.data().memberUids || []).filter(uid => uid !== member.id)
          if (memberUids.length !== (team.data().memberUids || []).length) {
            batch.update(team.ref, { memberUids, updatedAt: serverTimestamp() })
          }
        })
        await batch.commit()
      }

      const batch = writeBatch(db)
      batch.delete(doc(db, 'organisations', selectedOrgId, 'members', member.id))
      batch.delete(doc(db, 'users', member.id, 'organisations', selectedOrgId))
      await batch.commit()
      setNotice(label + ' was removed and their project access was revoked.')
    } catch {
      setError('Member removal did not finish. Some project access may remain; review the member list and try again.')
    } finally {
      setBusy(false)
    }
  }

  const revokeInvitation = async invitationId => {
    setError('')
    setNotice('')
    try {
      await updateDoc(doc(db, 'organisations', selectedOrgId, 'invitations', invitationId), { status: 'revoked' })
      setNotice('Invitation revoked.')
      if (inviteLink.includes('/' + invitationId)) setInviteLink('')
    } catch {
      setError('This invitation could not be revoked. Please try again.')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setNotice('Invitation link copied.')
    } catch {
      setError('Copy was blocked by the browser. Select and copy the link manually.')
    }
  }

  if (!canInvite) {
    return (
      <div className="v2-page">
        <div className="v2-page-header"><div><span className="v2-eyebrow">ORGANISATION</span><h1>Members & access</h1><p>View and manage people who collaborate in this workspace.</p></div></div>
        <div className="v2-empty-state v2-empty-state-compact"><span className="v2-empty-icon"><Icon name="shield" size={23}/></span><h3>Administrator access required</h3><p>Ask an organisation owner or administrator to manage invitations and membership.</p></div>
      </div>
    )
  }

  return (
    <div className="v2-page">
      <div className="v2-page-header"><div><span className="v2-eyebrow">ORGANISATION ACCESS</span><h1>Members & access</h1><p>Invite colleagues and manage the people who can work across {selectedOrganisation?.name || 'this organisation'}.</p></div></div>
      {error && <div className="v2-alert v2-alert-error" role="alert">{error}</div>}
      {notice && <div className="v2-alert v2-alert-success" role="status">{notice}</div>}
      <section className="v2-panel v2-member-invite-panel">
        <div className="v2-panel-heading"><div><h2>Invite someone</h2><p>Create a secure invitation link. It can only be accepted by the invited, verified email account.</p></div><span className="v2-panel-icon"><Icon name="user" size={18}/></span></div>
        <form className="v2-member-invite-form" onSubmit={createInvitation}>
          <label className="v2-field"><span>Email address</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com"/></label>
          <div className="v2-field"><span>Invitation role</span><div className="v2-readonly-role"><RolePill role="member"/><small>Members can collaborate across organisation launches. Project-specific guest access will be enabled with project sharing.</small></div></div>
          <button className="v2-button v2-button-primary" disabled={busy}>{busy ? 'Creating…' : 'Create invitation'} <Icon name="plus" size={15}/></button>
        </form>
        {inviteLink && <div className="v2-invite-link-box"><div><strong>Invitation link ready</strong><span>{inviteLink}</span></div><button className="v2-button v2-button-secondary" onClick={copyLink}><Icon name="copy" size={15}/> Copy link</button></div>}
        <p className="v2-invite-footnote">Links expire after seven days. Email delivery is not connected yet, so share the copied link directly.</p>
      </section>

      <section className="v2-panel">
        <div className="v2-panel-heading"><div><h2>Organisation members <span className="v2-count-badge">{members.length}</span></h2><p>People who currently belong to this organisation.</p></div></div>
        {loading ? <div className="v2-card-loading"><span className="v2-spinner"/>Loading members…</div> : members.length ? (
          <div className="v2-member-list">{members.map(member => {
            const canChange = member.role !== 'owner' && member.id !== user?.uid
            return <div className="v2-member-row" key={member.id}>
              <span className="v2-avatar">{(member.displayName || member.email || 'U').slice(0,1).toUpperCase()}</span>
              <div className="v2-member-info"><strong>{member.displayName || 'PLTK member'}</strong><small>{member.email || member.id}</small></div>
              {canChange ? <select aria-label={'Role for ' + (member.displayName || member.email || member.id)} value={member.role} onChange={event => changeMemberRole(member, event.target.value)} disabled={busy}>
                {(selectedOrganisation?.role === 'owner' ? ['admin','member','guest'] : ['member','guest']).map(role => <option key={role} value={role}>{role}</option>)}
              </select> : <RolePill role={member.role}/>}
              <span className="v2-member-active">{member.status || 'active'}</span>
              {canChange && <button className="v2-text-button v2-danger-text" onClick={() => removeMember(member)} disabled={busy}>Remove</button>}
            </div>
          })}</div>
        ) : <div className="v2-list-empty"><div><strong>No members found</strong><p>Invite colleagues to start collaborating.</p></div></div>}
      </section>

      <section className="v2-panel">
        <div className="v2-panel-heading"><div><h2>Pending invitations <span className="v2-count-badge">{invitations.filter(item => item.status === 'pending' && (!item.expiresAt?.toDate || item.expiresAt.toDate() > new Date())).length}</span></h2><p>Invitations awaiting acceptance.</p></div></div>
        {invitations.filter(item => item.status === 'pending').length ? (
          <div className="v2-member-list">{invitations.filter(item => item.status === 'pending').map(invitation => {
            const expired = invitation.expiresAt?.toDate && invitation.expiresAt.toDate() <= new Date()
            return <div className="v2-member-row" key={invitation.id}><span className="v2-avatar invite"><Icon name="mail" size={15}/></span><div className="v2-member-info"><strong>{invitation.email}</strong><small>{expired ? 'Expired' : 'Expires ' + (invitation.expiresAt?.toDate?.().toLocaleDateString() || 'in 7 days')}</small></div><RolePill role={invitation.role}/><button className="v2-text-button v2-revoke-button" onClick={() => revokeInvitation(invitation.id)}>Revoke</button></div>
          })}</div>
        ) : <div className="v2-list-empty"><div><strong>No pending invitations</strong><p>New invitations will appear here.</p></div></div>}
      </section>
    </div>
  )
}
